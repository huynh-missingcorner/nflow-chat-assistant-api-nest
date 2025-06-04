import { Injectable } from '@nestjs/common';

import { ChatSessionService } from '@/modules/chat-session/chat-session.service';
import { NFlowApplicationService } from '@/modules/nflow/services/application.service';
import { CreateApplicationDto, UpdateApplicationDto } from '@/modules/nflow/types';

import {
  APPLICATION_ERROR_MESSAGES,
  APPLICATION_GRAPH_NODES,
  APPLICATION_LOG_MESSAGES,
  APPLICATION_SUCCESS_MESSAGES,
} from '../constants/application-graph.constants';
import {
  ApplicationExecutionResult,
  ApplicationOperationType,
  ApplicationStateType,
} from '../types/application-graph-state.types';
import { ApplicationGraphNodeBase } from './application-graph-node.base';

@Injectable()
export class AppExecutorNode extends ApplicationGraphNodeBase {
  constructor(
    private readonly nflowApplicationService: NFlowApplicationService,
    private readonly chatSessionService: ChatSessionService,
  ) {
    super();
  }

  protected getNodeName(): string {
    return APPLICATION_GRAPH_NODES.APP_EXECUTOR;
  }

  async execute(state: ApplicationStateType): Promise<Partial<ApplicationStateType>> {
    try {
      this.logger.log('Starting application execution');

      if (!state.enrichedSpec) {
        throw new Error(APPLICATION_ERROR_MESSAGES.MISSING_REQUIRED_FIELDS + ': enrichedSpec');
      }

      if (!state.operationType) {
        throw new Error(APPLICATION_ERROR_MESSAGES.MISSING_REQUIRED_FIELDS + ': operationType');
      }

      if (!state.chatSessionId) {
        throw new Error(APPLICATION_ERROR_MESSAGES.MISSING_REQUIRED_FIELDS + ': chatSessionId');
      }

      // Get userId from chatSessionId
      const userId = await this.getUserId(state.chatSessionId);

      // Execute the application operation
      const executionResult = await this.executeApplicationOperation(
        state.enrichedSpec,
        state.operationType,
        userId,
      );

      this.logger.log(APPLICATION_LOG_MESSAGES.EXECUTION_COMPLETED);

      return this.createSuccessResult({
        executionResult,
        isCompleted: true,
      });
    } catch (error) {
      this.logger.error('Error in application execution:', error);
      return this.handleError(error, 'AppExecutorNode');
    }
  }

  /**
   * Get userId from chatSessionId
   * @param chatSessionId Chat session ID
   * @returns userId associated with the chat session
   */
  private async getUserId(chatSessionId: string): Promise<string> {
    return this.chatSessionService.getUserIdFromChatSession(chatSessionId);
  }

  private async executeApplicationOperation(
    enrichedSpec: NonNullable<ApplicationStateType['enrichedSpec']>,
    operationType: ApplicationOperationType,
    userId: string,
  ): Promise<ApplicationExecutionResult> {
    try {
      let result: unknown;

      switch (operationType) {
        case 'create_application':
          result = await this.createApplication(enrichedSpec, userId);
          break;
        case 'update_application':
          result = await this.updateApplication(enrichedSpec, userId);
          break;
        case 'delete_application':
          result = await this.deleteApplication(enrichedSpec, userId);
          break;
        default:
          throw new Error(`Unsupported operation type: ${operationType as string}`);
      }

      return {
        appId: enrichedSpec.appId || enrichedSpec.appName,
        operationType,
        status: 'success',
        result,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown execution error';
      this.logger.error(`Application ${operationType} failed:`, error);

      return {
        appId: enrichedSpec.appId || enrichedSpec.appName,
        operationType,
        status: 'failed',
        errors: [errorMessage],
      };
    }
  }

  private async createApplication(
    enrichedSpec: NonNullable<ApplicationStateType['enrichedSpec']>,
    userId: string,
  ): Promise<unknown> {
    this.logger.log(`Creating application: ${enrichedSpec.appName}`);

    if (!enrichedSpec.apiParameters) {
      throw new Error('Missing API parameters for application creation');
    }

    const createDto = enrichedSpec.apiParameters as unknown as CreateApplicationDto;
    const result = await this.nflowApplicationService.createApp(createDto, userId);

    this.logger.log(APPLICATION_SUCCESS_MESSAGES.APP_CREATED);
    return result;
  }

  private async updateApplication(
    enrichedSpec: NonNullable<ApplicationStateType['enrichedSpec']>,
    userId: string,
  ): Promise<unknown> {
    this.logger.log(`Updating application: ${enrichedSpec.appName}`);

    if (!enrichedSpec.apiParameters) {
      throw new Error('Missing API parameters for application update');
    }

    const updateDto = enrichedSpec.apiParameters as unknown as UpdateApplicationDto;
    const result = await this.nflowApplicationService.updateApp(updateDto, userId);

    this.logger.log(APPLICATION_SUCCESS_MESSAGES.APP_UPDATED);
    return result;
  }

  private async deleteApplication(
    enrichedSpec: NonNullable<ApplicationStateType['enrichedSpec']>,
    userId: string,
  ): Promise<unknown> {
    this.logger.log(`Deleting application: ${enrichedSpec.appName}`);

    if (!enrichedSpec.apiParameters) {
      throw new Error('Missing API parameters for deletion');
    }

    const deleteParams = enrichedSpec.apiParameters as { names?: string[] };
    const names = deleteParams.names;

    if (!names || names.length === 0) {
      throw new Error('No application names provided for deletion');
    }

    // Delete each application (the service expects one app name at a time)
    for (const appName of names) {
      await this.nflowApplicationService.deleteApp(appName, userId);
    }

    this.logger.log(APPLICATION_SUCCESS_MESSAGES.APP_DELETED);
    return { success: true, message: APPLICATION_SUCCESS_MESSAGES.APP_DELETED, deletedApps: names };
  }
}
