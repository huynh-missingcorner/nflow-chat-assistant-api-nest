import { Injectable, Logger } from '@nestjs/common';
import { ApplicationAgentService } from '../../application-agent/application-agent.service';
import { ObjectAgentService } from '../../object-agent/object-agent.service';
import { LayoutAgentService } from '../../layout-agent/layout-agent.service';
import { FlowAgentService } from '../../flow-agent/flow-agent.service';
import { IntentTask } from '../../intent-agent/types/intent.types';
import {
  ApplicationAgentInput,
  ApplicationAgentOutput,
} from '../../application-agent/types/application.types';
import { ObjectAgentInput, ObjectAgentOutput } from '../../object-agent/types/object.types';
import { LayoutAgentInput, LayoutAgentOutput } from '../../layout-agent/types/layout.types';
import { FlowAgentInput, FlowAgentOutput } from '../../flow-agent/types/flow.types';
import { BaseAgentResponse } from '../types';
import { ActiveAgent, AgentStatus, DEFAULT_AGENT_STATUS } from '../consts';
import { ProcessedTasks } from '../../executor-agent/types/executor.types';
import { ToolNameGeneratorService } from './tool-name-generator.service';

@Injectable()
export class TaskExecutorService {
  private readonly logger = new Logger(TaskExecutorService.name);
  private agentStatus: Record<ActiveAgent, AgentStatus> = { ...DEFAULT_AGENT_STATUS };

  constructor(
    private readonly applicationService: ApplicationAgentService,
    private readonly objectService: ObjectAgentService,
    private readonly layoutService: LayoutAgentService,
    private readonly flowService: FlowAgentService,
    private readonly toolNameGenerator: ToolNameGeneratorService,
  ) {}

  /**
   * Get the tool calls for the intent plan
   * @param tasks The intent tasks to execute
   * @returns The processed tasks with their results
   */
  public async executeTasksInOrder(tasks: IntentTask[]): Promise<ProcessedTasks> {
    const results: ProcessedTasks = {};
    const completed = new Set<string>();

    // Filter out tasks for disabled agents
    const filteredTasks = tasks.filter((task) => {
      const isEnabled = this.agentStatus[task.agent as ActiveAgent]?.enabled ?? false;
      if (!isEnabled) {
        this.logger.log(`Skipping task for disabled agent: ${task.agent}`);
        // Mark as completed so dependent tasks don't get stuck
        completed.add(task.agent);
      }
      return isEnabled;
    });

    const remainingTasks = [...filteredTasks];

    while (remainingTasks.length > 0) {
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

      await Promise.all(
        executableTasks.map(async (task) => {
          const result = await this.executeTask(task);

          if (this.isAgentResponse(result)) {
            this.toolNameGenerator.processToolCallNames(result.toolCalls);
          }

          results[task.agent] = result;
          completed.add(task.agent);

          const index = remainingTasks.findIndex((t) => t.agent === task.agent);
          if (index !== -1) {
            remainingTasks.splice(index, 1);
          }
        }),
      );
    }

    return results;
  }

  /**
   * Execute a single task using the appropriate agent
   * @param task The task to execute
   * @returns Result of the task execution
   */
  private async executeTask(
    task: IntentTask,
  ): Promise<ApplicationAgentOutput | ObjectAgentOutput | LayoutAgentOutput | FlowAgentOutput> {
    this.logger.log(`Executing task for ${task.agent}: ${task.description}`);

    const agentKey = task.agent as ActiveAgent;
    if (!this.agentStatus[agentKey]?.enabled) {
      this.logger.warn(`Attempted to execute task for disabled agent: ${task.agent}`);

      // Return an empty response for disabled agents
      return {
        toolCalls: [],
      };
    }

    switch (task.agent) {
      case 'ApplicationAgent':
        return this.applicationService.run(task.data as ApplicationAgentInput);
      case 'ObjectAgent':
        return this.objectService.run(task.data as ObjectAgentInput);
      case 'LayoutAgent':
        return this.layoutService.run(task.data as LayoutAgentInput);
      case 'FlowAgent':
        return this.flowService.run(task.data as FlowAgentInput);
      default:
        throw new Error('Unknown agent type');
    }
  }

  private isAgentResponse(result: unknown): result is BaseAgentResponse {
    return result !== null && typeof result === 'object' && 'toolCalls' in result;
  }
}
