import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { ContextLoaderService } from 'src/shared/services/context-loader.service';
import {
  GenerateObjectsParams,
  GenerateObjectsResponse,
  ObjectDefinition,
  ObjectField,
} from './types/object.types';
import { ObjectErrors, ObjectPrompts, ObjectDefaults } from './constants/object.constants';

@Injectable()
export class ObjectService {
  private readonly logger = new Logger(ObjectService.name);
  private readonly AGENT_PATH = 'src/modules/agents/object-agent';

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly prisma: PrismaService,
    private readonly contextLoader: ContextLoaderService,
  ) {}

  /**
   * Generate object definitions based on application features and components
   * @param params Parameters containing features, components, and session information
   * @returns Object definitions and suggested next steps
   */
  async generateObjects(params: GenerateObjectsParams): Promise<GenerateObjectsResponse> {
    try {
      this.validateFeatures(params);

      // Load context from file
      const context = await this.contextLoader.loadContext(this.AGENT_PATH);

      const messages = [
        {
          role: 'system' as const,
          content: `${ObjectPrompts.SYSTEM_CONTEXT}\n\n${context}`,
        },
        {
          role: 'user' as const,
          content: `${ObjectPrompts.OBJECT_ANALYSIS}\n\nFeatures: ${JSON.stringify(
            params.features,
            null,
            2,
          )}\n\nComponents: ${JSON.stringify(params.components, null, 2)}`,
        },
        {
          role: 'system' as const,
          content: ObjectPrompts.RESPONSE_FORMAT,
        },
      ];

      const completion = await this.openAIService.generateChatCompletion(messages);
      const response = this.parseAndValidateResponse(completion, params.applicationId);

      await this.logGeneration(params, response);

      return response;
    } catch (error) {
      this.logger.error('Object generation failed', error);
      throw new Error(error instanceof Error ? error.message : ObjectErrors.GENERATION_FAILED);
    }
  }

  /**
   * Validate the input features and components
   * @param params Generation parameters
   */
  private validateFeatures(params: GenerateObjectsParams): void {
    if (!Array.isArray(params.features) || !Array.isArray(params.components)) {
      throw new Error(ObjectErrors.INVALID_FEATURES);
    }

    if (params.features.length === 0 || params.components.length === 0) {
      throw new Error(ObjectErrors.INVALID_FEATURES);
    }
  }

  /**
   * Parse and validate the OpenAI response
   * @param completion OpenAI completion string
   * @param applicationId Application ID for the objects
   * @returns Parsed and validated response
   */
  private parseAndValidateResponse(
    completion: string,
    applicationId: string,
  ): GenerateObjectsResponse {
    try {
      const response = JSON.parse(completion) as GenerateObjectsResponse;
      response.objectPayload.payload.applicationId = applicationId;

      this.validateObjectDefinitions(response.objectPayload.payload.objects);
      return response;
    } catch (error) {
      this.logger.error('Failed to parse OpenAI response', error);
      throw new Error(ObjectErrors.GENERATION_FAILED);
    }
  }

  /**
   * Validate object definitions and their fields
   * @param objects Array of object definitions
   */
  private validateObjectDefinitions(objects: ObjectDefinition[]): void {
    if (!Array.isArray(objects) || objects.length === 0) {
      throw new Error(ObjectErrors.GENERATION_FAILED);
    }

    for (const object of objects) {
      this.validateFields(object.fields);
      this.validateIndexes(object);
      this.validatePermissions(object);
    }
  }

  /**
   * Validate object fields and their configurations
   * @param fields Array of object fields
   */
  private validateFields(fields: ObjectField[]): void {
    if (!Array.isArray(fields) || fields.length === 0) {
      throw new Error(ObjectErrors.GENERATION_FAILED);
    }

    const validTypes = Object.values(ObjectDefaults.FIELD_TYPES);
    const validOnDeleteActions = Object.values(ObjectDefaults.ON_DELETE_ACTIONS);

    for (const field of fields) {
      if (!validTypes.includes(field.type)) {
        throw new Error(ObjectErrors.INVALID_FIELD_TYPE);
      }

      if (
        field.reference &&
        field.type === 'reference' &&
        field.reference.onDelete &&
        !validOnDeleteActions.includes(field.reference.onDelete)
      ) {
        throw new Error(ObjectErrors.INVALID_REFERENCE);
      }
    }
  }

  /**
   * Validate object indexes configuration
   * @param object Object definition
   */
  private validateIndexes(object: ObjectDefinition): void {
    if (!object.indexes) return;

    const validTypes = Object.values(ObjectDefaults.INDEX_TYPES);
    const fieldNames = new Set(object.fields.map((f) => f.name));

    for (const index of object.indexes) {
      if (!validTypes.includes(index.type)) {
        throw new Error(ObjectErrors.GENERATION_FAILED);
      }

      if (!index.fields.every((field) => fieldNames.has(field))) {
        throw new Error(ObjectErrors.GENERATION_FAILED);
      }
    }
  }

  /**
   * Validate object permissions configuration
   * @param object Object definition
   */
  private validatePermissions(object: ObjectDefinition): void {
    if (!object.permissions) return;

    const validOperations = ['create', 'read', 'update', 'delete'];
    const permissions = object.permissions;

    for (const operation of validOperations) {
      const roles = permissions[operation as keyof typeof permissions];
      if (roles && !Array.isArray(roles)) {
        throw new Error(ObjectErrors.GENERATION_FAILED);
      }
    }
  }

  /**
   * Log the object generation result
   * @param params Original generation parameters
   * @param response Generated response
   */
  private async logGeneration(
    params: GenerateObjectsParams,
    response: GenerateObjectsResponse,
  ): Promise<void> {
    try {
      await this.prisma.agentResult.create({
        data: {
          agentType: 'OBJECT_AGENT',
          sessionId: params.sessionId,
          messageId: params.messageId,
          input: JSON.stringify({
            features: params.features,
            components: params.components,
          }),
          output: JSON.stringify(response),
          status: 'COMPLETED',
          duration: 0, // TODO: Add actual duration tracking
        },
      });
    } catch (error) {
      this.logger.error('Failed to log object generation', error);
    }
  }
}
