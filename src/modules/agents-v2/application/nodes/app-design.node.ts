import { Injectable } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ToolCall } from '@langchain/core/messages/tool';

import { OPENAI_GPT_4_1 } from '@/shared/infrastructure/langchain/models/openai/openai-models';

import {
  APPLICATION_ERROR_MESSAGES,
  APPLICATION_GRAPH_NODES,
  APPLICATION_LOG_MESSAGES,
} from '../constants/application-graph.constants';
import { APP_DESIGN_SYSTEM_PROMPT, formatAppDesignPrompt } from '../context/app-design.context';
import {
  appValidationTool,
  createNewApplicationTool,
  removeApplicationsTool,
  updateApplicationTool,
} from '../tools';
import {
  ApplicationOperationType,
  ApplicationStateType,
  EnrichedApplicationSpec,
} from '../types/application-graph-state.types';
import { ApplicationGraphNodeBase } from './application-graph-node.base';

interface ValidationResult {
  isValid: boolean;
  validationErrors?: string[];
  warnings?: string[];
  suggestions?: string[];
}

interface ProcessedToolCalls {
  enrichedSpec: EnrichedApplicationSpec;
  apiParameters?: Record<string, unknown>;
}

@Injectable()
export class AppDesignNode extends ApplicationGraphNodeBase {
  protected getNodeName(): string {
    return APPLICATION_GRAPH_NODES.APP_DESIGN;
  }

  async execute(state: ApplicationStateType): Promise<Partial<ApplicationStateType>> {
    try {
      this.logger.log('Starting application design enhancement');

      if (!state.applicationSpec) {
        throw new Error(APPLICATION_ERROR_MESSAGES.MISSING_REQUIRED_FIELDS + ': applicationSpec');
      }

      if (!state.operationType) {
        throw new Error(APPLICATION_ERROR_MESSAGES.MISSING_REQUIRED_FIELDS + ': operationType');
      }

      // For delete operations, we only need minimal spec validation
      if (state.operationType === 'delete_application') {
        const enrichedSpec = this.createMinimalDeleteSpec(
          state.applicationSpec,
          state.operationType,
        );
        return this.createSuccessResult({
          enrichedSpec,
          messages: state.messages,
        });
      }

      // Get appropriate tools based on operation type
      const tools = this.getToolsForOperation(state.operationType);
      const llm = OPENAI_GPT_4_1.bindTools(tools);

      const messages = [
        new SystemMessage(this.getSystemPromptForOperation(state.operationType)),
        new HumanMessage(formatAppDesignPrompt(state.applicationSpec)),
      ];

      const result = await llm.invoke(messages);

      // Process tool calls to extract API parameters
      const designResult = this.processToolCalls(result.tool_calls || [], state.operationType);

      // Validate the enriched specification
      this.validateEnrichedSpec(designResult.enrichedSpec, state.operationType);

      this.logger.log(APPLICATION_LOG_MESSAGES.DESIGN_COMPLETED);

      return this.createSuccessResult({
        enrichedSpec: designResult.enrichedSpec,
        messages: state.messages.concat(result),
      });
    } catch (error) {
      this.logger.error('Error in application design:', error);
      return this.handleError(error, 'AppDesignNode');
    }
  }

  private getToolsForOperation(operationType: ApplicationOperationType) {
    switch (operationType) {
      case 'create_application':
        return [createNewApplicationTool, appValidationTool];
      case 'update_application':
        return [updateApplicationTool, appValidationTool];
      case 'delete_application':
        return [removeApplicationsTool, appValidationTool];
      default:
        return [appValidationTool];
    }
  }

  private getSystemPromptForOperation(operationType: ApplicationOperationType): string {
    const basePrompt = APP_DESIGN_SYSTEM_PROMPT;

    switch (operationType) {
      case 'create_application':
        return `${basePrompt}\n\nYou are creating a new application. Use the create_new_application tool to extract and structure the required parameters for the NFlow API.`;
      case 'update_application':
        return `${basePrompt}\n\nYou are updating an existing application. Use the update_application tool to extract and structure the required parameters for the NFlow API. Focus on the changes and improvements needed.`;
      case 'delete_application':
        return `${basePrompt}\n\nYou are preparing an application for deletion. Use the remove_applications tool to extract the application name. Only validate the application name and basic structure.`;
      default:
        return basePrompt;
    }
  }

  private createMinimalDeleteSpec(
    applicationSpec: ApplicationStateType['applicationSpec'],
    operationType: ApplicationOperationType,
  ): EnrichedApplicationSpec {
    if (!applicationSpec) {
      throw new Error('Application spec is required');
    }

    return {
      appName: applicationSpec.appName,
      description: applicationSpec.description,
      operationType,
      appId: applicationSpec.appName,
      objects: [],
      layouts: [],
      flows: [],
      objectIds: [],
      layoutIds: [],
      flowIds: [],
      dependencies: [],
      profiles: ['admin'],
      tagNames: [],
      credentials: [],
      metadata: applicationSpec.metadata || {},
      apiParameters: {
        names: [applicationSpec.appName], // For delete operation
      },
    };
  }

  private processToolCalls(
    toolCalls: ToolCall[],
    operationType: ApplicationOperationType,
  ): ProcessedToolCalls {
    let enrichedSpec: EnrichedApplicationSpec | null = null;
    let validationResult: ValidationResult | null = null;
    let apiParameters: Record<string, unknown> | undefined = undefined;

    for (const toolCall of toolCalls) {
      if (this.isApplicationManagementTool(toolCall.name)) {
        // Extract API parameters from tool call
        apiParameters = toolCall.args as Record<string, unknown>;
        // Generate enriched spec from API parameters
        enrichedSpec = this.generateEnrichedSpecFromToolCall(
          toolCall.args as Record<string, unknown>,
          operationType,
        );
      } else if (toolCall.name === 'app_validation_checker') {
        validationResult = toolCall.args as ValidationResult;
      }
    }

    if (!enrichedSpec) {
      throw new Error('No application management tool found in LLM response');
    }

    if (validationResult && !validationResult.isValid) {
      throw new Error(
        APPLICATION_ERROR_MESSAGES.DESIGN_VALIDATION_FAILED +
          ': ' +
          (validationResult.validationErrors?.join(', ') || 'Unknown validation error'),
      );
    }

    return { enrichedSpec, apiParameters };
  }

  private isApplicationManagementTool(toolName: string): boolean {
    return [
      'ApiAppBuilderController_createApp',
      'ApiAppBuilderController_updateApp',
      'ApiAppBuilderController_removeApps',
    ].includes(toolName);
  }

  private generateEnrichedSpecFromToolCall(
    toolArgs: Record<string, unknown>,
    operationType: ApplicationOperationType,
  ): EnrichedApplicationSpec {
    // Base spec from tool arguments
    const baseSpec = {
      operationType,
      objects: [],
      layouts: [],
      flows: [],
      objectIds: [],
      layoutIds: [],
      flowIds: [],
      dependencies: [],
      metadata: {},
      apiParameters: toolArgs, // Store the extracted API parameters
    };

    switch (operationType) {
      case 'create_application':
      case 'update_application':
        return {
          ...baseSpec,
          appName: (toolArgs.displayName as string) || (toolArgs.name as string) || '',
          description: toolArgs.description as string | undefined,
          appId: (toolArgs.name as string) || '',
          profiles: (toolArgs.profiles as string[]) || ['admin'],
          tagNames: (toolArgs.tagNames as string[]) || [],
          credentials: (toolArgs.credentials as string[]) || [],
        };

      case 'delete_application': {
        const names = toolArgs.names as string[] | undefined;
        return {
          ...baseSpec,
          appName: names?.[0] || '',
          appId: names?.[0] || '',
          profiles: ['admin'],
          tagNames: [],
          credentials: [],
        };
      }

      default:
        throw new Error(`Unsupported operation type: ${operationType as string}`);
    }
  }

  private validateEnrichedSpec(
    spec: EnrichedApplicationSpec,
    operationType: ApplicationOperationType,
  ): void {
    if (!spec.appId) {
      throw new Error(APPLICATION_ERROR_MESSAGES.MISSING_REQUIRED_FIELDS + ': appId');
    }

    if (!spec.appName || spec.appName.trim().length === 0) {
      throw new Error(APPLICATION_ERROR_MESSAGES.INVALID_SPEC + ': appName cannot be empty');
    }

    // For delete operations, we only need basic validation
    if (operationType === 'delete_application') {
      return;
    }

    // Validate API parameters are present
    if (!spec.apiParameters) {
      throw new Error(APPLICATION_ERROR_MESSAGES.MISSING_REQUIRED_FIELDS + ': apiParameters');
    }
  }
}
