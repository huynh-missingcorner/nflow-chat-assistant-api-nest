import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { ContextFile, ContextLoaderService } from 'src/shared/services/context-loader.service';
import { AGENT_PATHS } from 'src/shared/constants/agent-paths.constants';
import {
  GenerateObjectsParams,
  GenerateObjectsResponse,
  ObjectSchema,
  ObjectToolCall,
  ToolCallPayload,
} from './types/object.types';
import { ObjectErrors, ObjectPrompts } from './constants/object.constants';
import { createNewFieldTool, createNewObjectTool, schemaDesignerTool } from './tools/object-tools';

@Injectable()
export class ObjectService {
  private readonly logger = new Logger(ObjectService.name);
  private readonly AGENT_PATH = AGENT_PATHS.OBJECT;
  private readonly CONTEXTS_PATH = 'contexts';

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly contextLoader: ContextLoaderService,
  ) {}

  /**
   * Generate object definitions and their field schemas based on application features and components
   * This is a two-phase process:
   * 1. Design the database schema
   * 2. Generate the tool calls to implement the schema
   */
  async generateObjects(params: GenerateObjectsParams): Promise<GenerateObjectsResponse> {
    try {
      // Phase 1: Design the schema
      const schemas = await this.designObjectSchemas(params);

      // Phase 2: Generate tool calls based on the schema
      const toolCalls = await this.generateToolCalls(params.action, schemas);

      return {
        toolCalls,
        metadata: {
          totalObjects: params.objects.length,
          generatedAt: new Date().toISOString(),
          schemas, // Include the designed schemas in metadata for reference
        },
      };
    } catch (error) {
      this.logger.error('Object generation failed', error);
      throw new Error(error instanceof Error ? error.message : ObjectErrors.GENERATION_FAILED);
    }
  }

  /**
   * Phase 1: Design the database schema for each object
   * This phase focuses purely on schema design without concerning about implementation details
   */
  private async designObjectSchemas(params: GenerateObjectsParams): Promise<ObjectSchema[]> {
    const combinedContext = await this.loadAgentContexts();

    const schemaDesignPrompt = `${ObjectPrompts.OBJECT_DESIGN_PROMPT} ${JSON.stringify(params.objects, null, 2)}`;

    const schemaDesignMessages = [
      {
        role: 'system' as const,
        content: combinedContext,
      },
      {
        role: 'user' as const,
        content: schemaDesignPrompt,
      },
    ];

    const options = {
      tools: [schemaDesignerTool],
      tool_choice: { type: 'function', function: { name: 'SchemaDesigner_designSchema' } } as const,
      temperature: 0.2,
      maxTokens: 4000,
    };

    const completion = await this.openAIService.generateFunctionCompletion(
      schemaDesignMessages,
      options,
    );

    if (!completion.toolCalls?.length) {
      throw new Error(ObjectErrors.SCHEMA_DESIGN_FAILED);
    }

    try {
      const schemaToolCall = completion.toolCalls[0];
      const schemaArguments = JSON.parse(schemaToolCall.function.arguments) as {
        schemas: ObjectSchema[];
      };
      return schemaArguments.schemas;
    } catch (error) {
      this.logger.error('Failed to parse schema design response', error);
      throw new Error(ObjectErrors.SCHEMA_DESIGN_FAILED);
    }
  }

  /**
   * Phase 2: Generate tool calls to implement the designed schemas
   * This phase translates the abstract schema into concrete API calls
   */
  private async generateToolCalls(
    action: string,
    schemas: ObjectSchema[],
  ): Promise<ObjectToolCall[]> {
    try {
      // Step 1: Generate object creation tool calls
      const objectToolCalls = await this.generateObjectCreationCalls(action, schemas);

      // Step 2: Generate field creation tool calls for each object
      const fieldToolCalls = await this.generateFieldCreationCalls(action, schemas);

      // Combine and order all tool calls
      const allToolCalls: ToolCallPayload[] = [...objectToolCalls, ...fieldToolCalls];

      return allToolCalls.map((toolCall, index) => ({
        order: index + 1,
        toolCall,
      }));
    } catch (error) {
      this.logger.error('Failed to generate tool calls', error);
      throw new Error(ObjectErrors.TOOL_CALLS_GENERATION_FAILED);
    }
  }

  /**
   * Generate tool calls for creating objects
   */
  private async generateObjectCreationCalls(
    action: string,
    schemas: ObjectSchema[],
  ): Promise<ToolCallPayload[]> {
    const combinedContext = await this.loadAgentContexts();
    const prompt = (ObjectPrompts.OBJECT_CREATION_PROMPT as string)
      .replace('{action}', action)
      .replace('{schemas}', JSON.stringify(schemas, null, 2));

    const messages = [
      {
        role: 'system' as const,
        content: combinedContext,
      },
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    const options = {
      tools: [createNewObjectTool],
      tool_choice: {
        type: 'function',
        function: { name: 'ObjectController_changeObject' },
      } as const,
      temperature: 0.2,
      max_tokens: 4000,
    };

    const completion = await this.openAIService.generateFunctionCompletion(messages, options);
    if (!completion.toolCalls?.length) {
      throw new Error(ObjectErrors.TOOL_CALLS_GENERATION_FAILED);
    }

    return completion.toolCalls.map((toolCall) => ({
      functionName: toolCall.function.name,
      arguments: JSON.parse(toolCall.function.arguments) as Record<string, unknown>,
    }));
  }

  /**
   * Generate tool calls for creating fields for each object
   */
  private async generateFieldCreationCalls(
    action: string,
    schemas: ObjectSchema[],
  ): Promise<ToolCallPayload[]> {
    const combinedContext = await this.loadAgentContexts();
    const allFieldToolCalls: ToolCallPayload[] = [];

    // Process each schema
    for (const schema of schemas) {
      // Process each field in the schema
      for (const field of schema.fields) {
        const messages = [
          {
            role: 'system' as const,
            content: combinedContext,
          },
          {
            role: 'user' as const,
            content: `Create a field with these specifications for object "${schema.name}":
${JSON.stringify(field, null, 2)}

Requirements:
1. Set objName to "${schema.name}"
2. Set action to "${action}"
3. Map the field type correctly
4. Include all field attributes`,
          },
        ];

        const options = {
          tools: [createNewFieldTool],
          tool_choice: {
            type: 'function',
            function: { name: 'FieldController_changeField' },
          } as const,
          temperature: 0.2,
          max_tokens: 4000,
        };

        const completion = await this.openAIService.generateFunctionCompletion(messages, options);
        if (!completion.toolCalls?.length) {
          this.logger.warn(
            `No field tool call generated for field ${field.name} in object ${schema.name}`,
          );
          continue;
        }

        const fieldToolCalls = completion.toolCalls.map((toolCall) => ({
          functionName: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments) as Record<string, unknown>,
        }));

        allFieldToolCalls.push(...fieldToolCalls);
      }
    }

    return allFieldToolCalls;
  }

  private async loadAgentContexts(): Promise<string> {
    try {
      const contextFiles = await this.contextLoader.loadContextDirectory(
        `${this.AGENT_PATH}/${this.CONTEXTS_PATH}`,
      );

      return contextFiles
        .map((file: ContextFile) => `# ${file.name}\n\n${file.content}`)
        .join('\n\n---\n\n');
    } catch (error) {
      this.logger.error('Failed to load agent contexts', error);
      throw new Error(ObjectErrors.CONTEXT_LOAD_ERROR);
    }
  }
}
