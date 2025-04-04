import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from '../../openai/openai.service';
import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { ContextLoaderService } from 'src/shared/services/context-loader.service';
import {
  GenerateFlowsParams,
  GenerateFlowsResponse,
  FlowDefinition,
  FlowTrigger,
  FlowAction,
  FlowCondition,
} from './types/flow.types';
import { FlowErrors, FlowPrompts, FlowDefaults } from './constants/flow.constants';

@Injectable()
export class FlowService {
  private readonly logger = new Logger(FlowService.name);
  private readonly AGENT_PATH = 'src/modules/agents/flow-agent';

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly prisma: PrismaService,
    private readonly contextLoader: ContextLoaderService,
  ) {}

  /**
   * Generate flow definitions based on application features, components, objects, and layouts
   * @param params Parameters containing features, components, objects, layouts, and session information
   * @returns Flow definitions and suggested next steps
   */
  async generateFlows(params: GenerateFlowsParams): Promise<GenerateFlowsResponse> {
    try {
      this.validateInput(params);

      // Load context from file
      const context = await this.contextLoader.loadContext(this.AGENT_PATH);

      const messages = [
        {
          role: 'system' as const,
          content: `${FlowPrompts.SYSTEM_CONTEXT}\n\n${context}`,
        },
        {
          role: 'user' as const,
          content: `${FlowPrompts.FLOW_ANALYSIS}\n\nFeatures: ${JSON.stringify(
            params.features,
            null,
            2,
          )}\n\nComponents: ${JSON.stringify(
            params.components,
            null,
            2,
          )}\n\nObjects: ${JSON.stringify(
            params.objects,
            null,
            2,
          )}\n\nLayouts: ${JSON.stringify(params.layouts, null, 2)}`,
        },
        {
          role: 'system' as const,
          content: FlowPrompts.RESPONSE_FORMAT,
        },
      ];

      const completion = await this.openAIService.generateChatCompletion(messages);
      const response = this.parseAndValidateResponse(completion, params.applicationId);

      await this.logGeneration(params, response);

      return response;
    } catch (error) {
      this.logger.error('Flow generation failed', error);
      throw new Error(error instanceof Error ? error.message : FlowErrors.GENERATION_FAILED);
    }
  }

  /**
   * Validate the input parameters
   * @param params Generation parameters
   */
  private validateInput(params: GenerateFlowsParams): void {
    if (!Array.isArray(params.features) || !Array.isArray(params.components)) {
      throw new Error(FlowErrors.INVALID_FEATURES);
    }

    if (!Array.isArray(params.objects) || params.objects.length === 0) {
      throw new Error(FlowErrors.INVALID_OBJECTS);
    }

    if (!Array.isArray(params.layouts) || params.layouts.length === 0) {
      throw new Error(FlowErrors.INVALID_LAYOUTS);
    }

    if (params.features.length === 0 || params.components.length === 0) {
      throw new Error(FlowErrors.INVALID_FEATURES);
    }
  }

  /**
   * Parse and validate the OpenAI response
   * @param completion OpenAI completion string
   * @param applicationId Application ID for the flows
   * @returns Parsed and validated response
   */
  private parseAndValidateResponse(
    completion: string,
    applicationId: string,
  ): GenerateFlowsResponse {
    try {
      const response = JSON.parse(completion) as GenerateFlowsResponse;
      response.flowPayload.payload.applicationId = applicationId;

      this.validateFlowDefinitions(response.flowPayload.payload.flows);
      return response;
    } catch (error) {
      this.logger.error('Failed to parse OpenAI response', error);
      throw new Error(FlowErrors.GENERATION_FAILED);
    }
  }

  /**
   * Validate flow definitions
   * @param flows Array of flow definitions
   */
  private validateFlowDefinitions(flows: FlowDefinition[]): void {
    if (!Array.isArray(flows) || flows.length === 0) {
      throw new Error(FlowErrors.GENERATION_FAILED);
    }

    for (const flow of flows) {
      this.validateTrigger(flow.trigger);
      this.validateActions(flow.actions);
      this.validateErrorHandling(flow);
      this.validatePermissions(flow);
    }
  }

  /**
   * Validate flow trigger
   * @param trigger Flow trigger configuration
   */
  private validateTrigger(trigger: FlowTrigger): void {
    const validTypes = Object.values(FlowDefaults.TRIGGER_TYPES);
    if (!validTypes.includes(trigger.type)) {
      throw new Error(FlowErrors.INVALID_TRIGGER_TYPE);
    }

    if (trigger.conditions) {
      this.validateConditions(trigger.conditions);
    }

    if (trigger.schedule) {
      this.validateSchedule(trigger.schedule);
    }

    if (trigger.webhook) {
      this.validateWebhook(trigger.webhook);
    }
  }

  /**
   * Validate flow actions recursively
   * @param actions Array of flow actions
   */
  private validateActions(actions: FlowAction[]): void {
    if (!Array.isArray(actions) || actions.length === 0) {
      throw new Error(FlowErrors.GENERATION_FAILED);
    }

    const validTypes = Object.values(FlowDefaults.ACTION_TYPES);

    for (const action of actions) {
      if (!validTypes.includes(action.type)) {
        throw new Error(FlowErrors.INVALID_ACTION_TYPE);
      }

      if (action.conditions) {
        this.validateConditions(action.conditions);
      }

      if (action.onSuccess) {
        this.validateActions(action.onSuccess);
      }

      if (action.onError) {
        this.validateActions(action.onError);
      }
    }
  }

  /**
   * Validate flow conditions
   * @param conditions Array of flow conditions
   */
  private validateConditions(conditions: FlowCondition[]): void {
    const validOperators = Object.values(FlowDefaults.CONDITION_OPERATORS);
    const validLogicalOperators = Object.values(FlowDefaults.LOGICAL_OPERATORS);

    for (const condition of conditions) {
      if (!validOperators.includes(condition.operator)) {
        throw new Error(FlowErrors.INVALID_CONDITION);
      }

      if (condition.logicalOperator && !validLogicalOperators.includes(condition.logicalOperator)) {
        throw new Error(FlowErrors.INVALID_CONDITION);
      }
    }
  }

  /**
   * Validate schedule configuration
   * @param schedule Schedule configuration
   */
  private validateSchedule(schedule: { cron: string; timezone: string }): void {
    if (!schedule.cron || !schedule.timezone) {
      throw new Error(FlowErrors.INVALID_SCHEDULE);
    }

    try {
      // Basic cron validation (could be more comprehensive)
      const parts = schedule.cron.split(' ');
      if (parts.length !== 5 && parts.length !== 6) {
        throw new Error(FlowErrors.INVALID_SCHEDULE);
      }
    } catch (error: unknown) {
      this.logger.error('Failed to validate schedule', error);
      throw new Error(FlowErrors.INVALID_SCHEDULE);
    }
  }

  /**
   * Validate webhook configuration
   * @param webhook Webhook configuration
   */
  private validateWebhook(webhook: { method: string; headers?: Record<string, string> }): void {
    const validMethods = Object.values(FlowDefaults.HTTP_METHODS) as string[];
    if (!validMethods.includes(webhook.method)) {
      throw new Error(FlowErrors.INVALID_WEBHOOK);
    }
  }

  /**
   * Validate error handling configuration
   * @param flow Flow definition
   */
  private validateErrorHandling(flow: FlowDefinition): void {
    if (!flow.errorHandling) return;

    if (flow.errorHandling.onError) {
      this.validateActions(flow.errorHandling.onError);
    }

    if (flow.errorHandling.notifyOnError && !Array.isArray(flow.errorHandling.notifyOnError)) {
      throw new Error(FlowErrors.GENERATION_FAILED);
    }
  }

  /**
   * Validate flow permissions configuration
   * @param flow Flow definition
   */
  private validatePermissions(flow: FlowDefinition): void {
    if (!flow.permissions) return;

    const validOperations = ['execute', 'edit'];
    const permissions = flow.permissions;

    for (const operation of validOperations) {
      const roles = permissions[operation as keyof typeof permissions];
      if (roles && !Array.isArray(roles)) {
        throw new Error(FlowErrors.GENERATION_FAILED);
      }
    }
  }

  /**
   * Log the flow generation result
   * @param params Original generation parameters
   * @param response Generated response
   */
  private async logGeneration(
    params: GenerateFlowsParams,
    response: GenerateFlowsResponse,
  ): Promise<void> {
    try {
      await this.prisma.agentResult.create({
        data: {
          agentType: 'FLOW_AGENT',
          sessionId: params.sessionId,
          messageId: params.messageId,
          input: JSON.stringify({
            features: params.features,
            components: params.components,
            objects: params.objects,
            layouts: params.layouts,
          }),
          output: JSON.stringify(response),
          status: 'COMPLETED',
          duration: 0, // TODO: Add actual duration tracking
        },
      });
    } catch (error) {
      this.logger.error('Failed to log flow generation', error);
    }
  }
}
