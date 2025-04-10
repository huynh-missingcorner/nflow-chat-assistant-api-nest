import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { ContextLoaderService } from 'src/shared/services/context-loader.service';
import { AGENT_PATHS } from 'src/shared/constants/agent-paths.constants';
import {
  GenerateLayoutsParams,
  GenerateLayoutsResponse,
  LayoutDefinition,
  LayoutComponent,
  LayoutType,
} from './types/layout.types';
import { LayoutErrors, LayoutPrompts, LayoutDefaults } from './constants/layout.constants';

@Injectable()
export class LayoutService {
  private readonly logger = new Logger(LayoutService.name);
  private readonly AGENT_PATH = AGENT_PATHS.LAYOUT;

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly prisma: PrismaService,
    private readonly contextLoader: ContextLoaderService,
  ) {}

  /**
   * Generate layout definitions based on application features, components, and objects
   * @param params Parameters containing features, components, objects, and session information
   * @returns Layout definitions and suggested next steps
   */
  async generateLayouts(params: GenerateLayoutsParams): Promise<GenerateLayoutsResponse> {
    try {
      this.validateInput(params);

      // Load context from file
      const context = await this.contextLoader.loadContext(this.AGENT_PATH);

      const messages = [
        {
          role: 'system' as const,
          content: `${LayoutPrompts.SYSTEM_CONTEXT}\n\n${context}`,
        },
        {
          role: 'user' as const,
          content: `${LayoutPrompts.LAYOUT_ANALYSIS}\n\nFeatures: ${JSON.stringify(
            params.features,
            null,
            2,
          )}\n\nComponents: ${JSON.stringify(
            params.components,
            null,
            2,
          )}\n\nObjects: ${JSON.stringify(params.objects, null, 2)}`,
        },
        {
          role: 'system' as const,
          content: LayoutPrompts.RESPONSE_FORMAT,
        },
      ];

      const completion = await this.openAIService.generateChatCompletion(messages);
      if (!completion.content) {
        throw new Error(LayoutErrors.GENERATION_FAILED);
      }
      const response = this.parseAndValidateResponse(completion.content, params.applicationId);

      await this.logGeneration(params, response);

      return response;
    } catch (error) {
      this.logger.error('Layout generation failed', error);
      throw new Error(error instanceof Error ? error.message : LayoutErrors.GENERATION_FAILED);
    }
  }

  /**
   * Validate the input parameters
   * @param params Generation parameters
   */
  private validateInput(params: GenerateLayoutsParams): void {
    if (!Array.isArray(params.features) || !Array.isArray(params.components)) {
      throw new Error(LayoutErrors.INVALID_FEATURES);
    }

    if (!Array.isArray(params.objects) || params.objects.length === 0) {
      throw new Error(LayoutErrors.INVALID_OBJECTS);
    }

    if (params.features.length === 0 || params.components.length === 0) {
      throw new Error(LayoutErrors.INVALID_FEATURES);
    }
  }

  /**
   * Parse and validate the OpenAI response
   * @param completion OpenAI completion string
   * @param applicationId Application ID for the layouts
   * @returns Parsed and validated response
   */
  private parseAndValidateResponse(
    completion: string,
    applicationId: string,
  ): GenerateLayoutsResponse {
    try {
      const response = JSON.parse(completion) as GenerateLayoutsResponse;
      response.layoutPayload.payload.applicationId = applicationId;

      this.validateLayoutDefinitions(response.layoutPayload.payload.layouts);
      return response;
    } catch (error) {
      this.logger.error('Failed to parse OpenAI response', error);
      throw new Error(LayoutErrors.GENERATION_FAILED);
    }
  }

  /**
   * Validate layout definitions and their components
   * @param layouts Array of layout definitions
   */
  private validateLayoutDefinitions(layouts: LayoutDefinition[]): void {
    if (!Array.isArray(layouts) || layouts.length === 0) {
      throw new Error(LayoutErrors.GENERATION_FAILED);
    }

    for (const layout of layouts) {
      this.validateLayoutType(layout.type);
      this.validateComponents(layout.components);
      this.validateDataSource(layout);
      this.validatePermissions(layout);
    }
  }

  /**
   * Validate layout type
   * @param type Layout type to validate
   */
  private validateLayoutType(type: LayoutType): void {
    const validTypes = Object.values(LayoutDefaults.LAYOUT_TYPES);
    if (!validTypes.includes(type)) {
      throw new Error(LayoutErrors.INVALID_LAYOUT_TYPE);
    }
  }

  /**
   * Validate layout components recursively
   * @param components Array of layout components
   */
  private validateComponents(components: LayoutComponent[]): void {
    if (!Array.isArray(components) || components.length === 0) {
      throw new Error(LayoutErrors.INVALID_COMPONENTS);
    }

    const validTypes = Object.values(LayoutDefaults.COMPONENT_TYPES);

    for (const component of components) {
      if (!validTypes.includes(component.type)) {
        throw new Error(LayoutErrors.INVALID_COMPONENT_TYPE);
      }

      if (component.binding) {
        this.validateBinding(component.binding);
      }

      if (component.children) {
        this.validateComponents(component.children);
      }
    }
  }

  /**
   * Validate component data binding
   * @param binding Component binding configuration
   */
  private validateBinding(binding: { object: string; field: string }): void {
    if (!binding.object || !binding.field) {
      throw new Error(LayoutErrors.INVALID_BINDING);
    }
  }

  /**
   * Validate layout data source configuration
   * @param layout Layout definition
   */
  private validateDataSource(layout: LayoutDefinition): void {
    if (!layout.dataSource) return;

    if (!layout.dataSource.object) {
      throw new Error(LayoutErrors.INVALID_BINDING);
    }

    if (layout.dataSource.sort) {
      const validOrders = Object.values(LayoutDefaults.SORT_ORDERS);
      for (const sort of layout.dataSource.sort) {
        if (!validOrders.includes(sort.order)) {
          throw new Error(LayoutErrors.INVALID_COMPONENTS);
        }
      }
    }
  }

  /**
   * Validate layout permissions configuration
   * @param layout Layout definition
   */
  private validatePermissions(layout: LayoutDefinition): void {
    if (!layout.permissions) return;

    const validOperations = ['view', 'edit'];
    const permissions = layout.permissions;

    for (const operation of validOperations) {
      const roles = permissions[operation as keyof typeof permissions];
      if (roles && !Array.isArray(roles)) {
        throw new Error(LayoutErrors.GENERATION_FAILED);
      }
    }
  }

  /**
   * Log the layout generation result
   * @param params Original generation parameters
   * @param response Generated response
   */
  private async logGeneration(
    params: GenerateLayoutsParams,
    response: GenerateLayoutsResponse,
  ): Promise<void> {
    try {
      await this.prisma.agentResult.create({
        data: {
          agentType: 'LAYOUT_AGENT',
          sessionId: params.sessionId,
          messageId: params.messageId,
          input: JSON.stringify({
            features: params.features,
            components: params.components,
            objects: params.objects,
          }),
          output: JSON.stringify(response),
          status: 'COMPLETED',
          duration: 0, // TODO: Add actual duration tracking
        },
      });
    } catch (error) {
      this.logger.error('Failed to log layout generation', error);
    }
  }
}
