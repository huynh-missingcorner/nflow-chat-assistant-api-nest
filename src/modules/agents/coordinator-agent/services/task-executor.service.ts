import { Injectable, Logger } from '@nestjs/common';
import { ApplicationAgentService } from '../../application-agent/application-agent.service';
import { ObjectAgentService } from '../../object-agent/object-agent.service';
import { LayoutAgentService } from '../../layout-agent/layout-agent.service';
import { FlowAgentService } from '../../flow-agent/flow-agent.service';
import { IntentTask } from '../../intent-agent/types/intent.types';
import { ApplicationAgentInput } from '../../application-agent/types/application.types';
import { ObjectAgentInput } from '../../object-agent/types/object.types';
import { LayoutAgentInput } from '../../layout-agent/types/layout.types';
import { FlowAgentInput } from '../../flow-agent/types/flow.types';
import { BaseAgentResponse } from '../types';
import { ActiveAgent, AgentStatus, DEFAULT_AGENT_STATUS } from '../consts';
import { ProcessedTasks } from '../../executor-agent/types/executor.types';
import { MemoryService } from 'src/modules/memory/memory.service';
import { Agent, AgentOutput, HITLRequest } from '../../types';
import { ShortTermMemory } from 'src/modules/memory/types';

@Injectable()
export class TaskExecutorService {
  private readonly logger = new Logger(TaskExecutorService.name);
  private agentStatus: Record<ActiveAgent, AgentStatus> = { ...DEFAULT_AGENT_STATUS };

  constructor(
    private readonly applicationService: ApplicationAgentService,
    private readonly objectService: ObjectAgentService,
    private readonly layoutService: LayoutAgentService,
    private readonly flowService: FlowAgentService,
    private readonly memoryService: MemoryService,
  ) {}

  /**
   * Get the tool calls for the intent plan
   * @param tasks The intent tasks to execute
   * @param sessionId The session ID for memory context
   * @returns The processed tasks with their results
   */
  public async executeTasksInOrder(
    tasks: IntentTask[],
    sessionId: string,
  ): Promise<ProcessedTasks> {
    // Initialize results to store execution outputs
    const taskResults: Record<string, AgentOutput> = {};
    const completed = new Set<string>();
    const pendingHITL: Record<string, HITLRequest> = {};

    // Get the current session context
    let sessionContext = await this.memoryService.getContext(sessionId);

    // Filter out tasks for disabled agents
    const filteredTasks = tasks.filter((task) => {
      const isEnabled = this.agentStatus[task.agent as ActiveAgent]?.enabled ?? false;
      if (!isEnabled) {
        this.logger.log(`Skipping task for disabled agent: ${task.agent}`);
        // Mark as completed so dependent tasks don't get stuck
        completed.add(task.id);
      }
      return isEnabled;
    });

    const remainingTasks = [...filteredTasks];

    while (remainingTasks.length > 0) {
      // Find tasks that can be executed (dependencies satisfied)
      let executableTasks = remainingTasks.filter(
        (task) => !task.dependsOn || task.dependsOn.every((dep) => completed.has(dep)),
      );

      // If there is only one task, we don't need to check for circular dependencies
      if (tasks.length === 1) {
        executableTasks = remainingTasks;
      }

      if (executableTasks.length === 0 && remainingTasks.length > 0) {
        throw new Error('Circular dependency detected in tasks');
      }

      // Check if any tasks need HITL clarification
      const tasksNeedingClarification = Object.keys(pendingHITL);
      if (tasksNeedingClarification.length > 0) {
        // Return early with pending HITL requests
        return {
          results: taskResults,
          pendingHITL,
        };
      }

      // Execute all tasks that can be run in parallel
      const taskPromises = executableTasks.map(async (task) => {
        try {
          // Add context to the task data
          const taskWithContext = {
            ...task,
            data: {
              ...task.data,
              context: sessionContext,
            },
          };

          const result = await this.executeTask(taskWithContext);

          // Check if the task execution requires human clarification
          if (this.requiresHITL(result)) {
            pendingHITL[task.id] = (result as unknown as BaseAgentResponse)
              .clarification as HITLRequest;
            return; // Skip rest of processing for this task
          }

          // Update session context with any memory patches
          if ('memoryPatch' in result && result.memoryPatch) {
            sessionContext = this.memoryService.patch(sessionContext, result.memoryPatch);
          }

          taskResults[task.id] = result;
          completed.add(task.id);

          // Remove completed task from remaining tasks
          const index = remainingTasks.findIndex((t) => t.id === task.id);
          if (index !== -1) {
            remainingTasks.splice(index, 1);
          }
        } catch (error) {
          this.logger.error(
            `Error executing task ${task.id} (${task.agent}): ${(error as Error).message}`,
            (error as Error).stack,
          );
          // Store error in results
          taskResults[task.id] = {
            toolCalls: [],
            error: (error as Error).message,
          };
          // Mark as completed to continue the flow
          completed.add(task.id);
          const index = remainingTasks.findIndex((t) => t.id === task.id);
          if (index !== -1) {
            remainingTasks.splice(index, 1);
          }
        }
      });

      await Promise.all(taskPromises);

      // If we have pending HITL requests, stop processing and return
      if (Object.keys(pendingHITL).length > 0) {
        return {
          results: taskResults,
          pendingHITL,
        };
      }
    }

    // TODO: Update the full session context with task results
    // We should update the task results only if the task execution by ExecutorAgent is successful
    // await this.memoryService.updateTaskResults(sessionId, { results: taskResults });

    return {
      results: taskResults,
    };
  }

  /**
   * Process HITL response and resume task execution
   * @param taskId The ID of the task requiring clarification
   * @param response The user's response to the clarification request
   * @param sessionId The session ID
   * @returns Updated processed tasks
   */
  public async processHITLResponse(
    taskId: string,
    response: string,
    sessionId: string,
    remainingTasks: IntentTask[],
  ): Promise<ProcessedTasks> {
    // Get the current session context
    const sessionContext = await this.memoryService.getContext(sessionId);

    // Find the task that needs clarification
    const task = remainingTasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    // Update the task data with the clarification response
    const updatedTask = {
      ...task,
      data: {
        ...task.data,
        context: sessionContext,
        clarification: response,
      },
    };

    // Re-execute the task with the clarification
    const result = await this.executeTask(updatedTask);

    // Update memory if needed
    if ('memoryPatch' in result && result.memoryPatch) {
      this.memoryService.patch(sessionContext, result.memoryPatch);
    }

    // Continue with the remaining tasks
    const updatedRemainingTasks = remainingTasks.filter((t) => t.id !== taskId);
    const partialResults = { [taskId]: result };

    // If there are more tasks, continue execution
    if (updatedRemainingTasks.length > 0) {
      const remainingResults = await this.executeTasksInOrder(updatedRemainingTasks, sessionId);
      return {
        results: {
          ...partialResults,
          ...remainingResults.results,
        },
        pendingHITL: remainingResults.pendingHITL,
      };
    }

    return {
      results: partialResults,
    };
  }

  /**
   * Execute a single task using the appropriate agent
   * @param task The task to execute with context
   * @returns Result of the task execution
   */
  private async executeTask(task: IntentTask, context?: ShortTermMemory): Promise<AgentOutput> {
    this.logger.log(`Executing task ${task.id} for ${task.agent}: ${task.description}`);

    const agentKey = task.agent;
    if (!this.agentStatus[agentKey]?.enabled) {
      this.logger.warn(`Attempted to execute task for disabled agent: ${task.agent}`);

      // Return an empty response for disabled agents
      return {
        toolCalls: [],
      };
    }

    switch (task.agent) {
      case Agent.ApplicationAgent:
        return this.applicationService.run({
          taskData: task.data as ApplicationAgentInput,
          context,
        });
      case Agent.ObjectAgent:
        return this.objectService.run({
          taskData: task.data as ObjectAgentInput,
          context,
        });
      case Agent.LayoutAgent:
        return this.layoutService.run({
          taskData: task.data as LayoutAgentInput,
          context,
        });
      case Agent.FlowAgent:
        return this.flowService.run({
          taskData: task.data as FlowAgentInput,
          context,
        });
      default:
        return {
          toolCalls: [],
        };
    }
  }

  /**
   * Check if a response requires human-in-the-loop clarification
   * @param result The agent execution result
   * @returns Boolean indicating if HITL is required
   */
  private requiresHITL(result: AgentOutput): boolean {
    return 'clarification' in result && !!result.clarification && !!result.clarification.prompt;
  }
}
