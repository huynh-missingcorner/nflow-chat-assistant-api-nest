import { Inject, Injectable, Logger } from '@nestjs/common';

import { ApplicationAgentService } from '@/modules/agents/application-agent/application-agent.service';
import { ApplicationAgentInput } from '@/modules/agents/application-agent/types/application.types';
import { ProcessedTasks } from '@/modules/agents/executor-agent/types/executor.types';
import { FlowAgentService } from '@/modules/agents/flow-agent/flow-agent.service';
import { FlowAgentInput } from '@/modules/agents/flow-agent/types/flow.types';
import { IntentTask } from '@/modules/agents/intent-agent/types/intent.types';
import { LayoutAgentService } from '@/modules/agents/layout-agent/layout-agent.service';
import { LayoutAgentInput } from '@/modules/agents/layout-agent/types/layout.types';
import { ObjectAgentService } from '@/modules/agents/object-agent/object-agent.service';
import { ObjectAgentInput } from '@/modules/agents/object-agent/types/object.types';
import { Agent, AgentOutput, HITLRequest } from '@/modules/agents/types';
import { MEMORY_SERVICE } from '@/modules/memory/const';
import type { IMemoryService } from '@/modules/memory/interfaces';
import { ShortTermMemory } from '@/modules/memory/types';

import { ActiveAgent, AgentStatus, DEFAULT_AGENT_STATUS } from '../consts';
import { BaseAgentResponse } from '../types';

@Injectable()
export class TaskExecutorService {
  private readonly logger = new Logger(TaskExecutorService.name);
  private agentStatus: Record<ActiveAgent, AgentStatus> = { ...DEFAULT_AGENT_STATUS };

  constructor(
    private readonly applicationService: ApplicationAgentService,
    private readonly objectService: ObjectAgentService,
    private readonly layoutService: LayoutAgentService,
    private readonly flowService: FlowAgentService,
    @Inject(MEMORY_SERVICE) private readonly memoryService: IMemoryService,
  ) {}

  /**
   * Get the tool calls for the intent plan
   * @param tasks The intent tasks to execute
   * @param chatSessionId The session ID for memory context
   * @returns The processed tasks with their results
   */
  public async executeTasksInOrder(
    tasks: IntentTask[],
    chatSessionId: string,
  ): Promise<ProcessedTasks> {
    const taskResults: Record<string, AgentOutput> = {};
    const completedTasks = new Set<string>();
    const pendingHITL: Record<string, HITLRequest> = {};
    let shortTermMemory = await this.memoryService.getContext(chatSessionId);

    // Filter out tasks for disabled agents
    const filteredTasks = tasks.filter((task) => {
      const isEnabled = this.agentStatus[task.agent as ActiveAgent]?.enabled ?? false;
      if (!isEnabled) {
        this.logger.log(`Skipping task for disabled agent: ${task.agent}`);
        // Mark as completed so dependent tasks don't get stuck
        completedTasks.add(task.id);
      }
      return isEnabled;
    });

    const remainingTasks = [...filteredTasks];

    while (remainingTasks.length > 0) {
      // Find tasks that can be executed (dependencies satisfied)
      let executableTasks = remainingTasks.filter(
        (task) => !task.dependsOn || task.dependsOn.every((dep) => completedTasks.has(dep)),
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
          const result = await this.executeTask(task, shortTermMemory);

          // Check if the task execution requires human clarification
          if (this.requiresHITL(result)) {
            pendingHITL[task.id] = (result as unknown as BaseAgentResponse)
              .clarification as HITLRequest;
            return; // Skip rest of processing for this task
          }

          // Update session context with any memory patches
          if ('memoryPatch' in result && result.memoryPatch) {
            shortTermMemory = await this.memoryService.updateContext(
              shortTermMemory,
              result.memoryPatch,
            );
          }

          taskResults[task.id] = result;
          completedTasks.add(task.id);

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
          completedTasks.add(task.id);
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

    return {
      results: taskResults,
    };
  }

  /**
   * Process HITL response and resume task execution
   * @param taskId The ID of the task requiring clarification
   * @param response The user's response to the clarification request
   * @param chatSessionId The session ID
   * @returns Updated processed tasks
   */
  public async processHITLResponse(
    taskId: string,
    response: string,
    chatSessionId: string,
    remainingTasks: IntentTask[],
  ): Promise<ProcessedTasks> {
    // Get the current session context
    const shortTermMemory = await this.memoryService.getContext(chatSessionId);

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
        context: shortTermMemory,
        clarification: response,
      },
    };

    // Re-execute the task with the clarification
    const result = await this.executeTask(updatedTask);

    // Update memory if needed
    if ('memoryPatch' in result && result.memoryPatch) {
      await this.memoryService.updateContext(shortTermMemory, result.memoryPatch);
    }

    // Continue with the remaining tasks
    const updatedRemainingTasks = remainingTasks.filter((t) => t.id !== taskId);
    const partialResults = { [taskId]: result };

    // If there are more tasks, continue execution
    if (updatedRemainingTasks.length > 0) {
      const remainingResults = await this.executeTasksInOrder(updatedRemainingTasks, chatSessionId);
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
