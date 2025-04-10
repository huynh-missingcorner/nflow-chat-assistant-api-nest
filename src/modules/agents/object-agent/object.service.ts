import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { ContextFile, ContextLoaderService } from 'src/shared/services/context-loader.service';
import { AGENT_PATHS } from 'src/shared/constants/agent-paths.constants';
import {
  GenerateObjectsParams,
  GenerateObjectsResponse,
  ObjectSchema,
  ObjectToolCall,
} from './types/object.types';
import { ObjectErrors } from './constants/object.constants';
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

    const schemaDesignPrompt = `As a database schema expert, design comprehensive database schemas for the following objects.

Requirements:
1. For each object, provide:
   - Object name and description
   - Primary identifier field
   - All necessary fields with their types and attributes
2. Follow database design best practices
3. Include all common required fields (id, createdAt, etc.)
4. Add context-specific fields based on the object type
5. Consider relationships between objects if relevant

Objects to design: ${JSON.stringify(params.objects, null, 2)}`;

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
      temperature: 0.7,
      maxTokens: 2000,
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
    const combinedContext = await this.loadAgentContexts();

    const toolCallPrompt = `As a Nflow platform expert, generate the necessary tool calls to implement these database schemas: ${JSON.stringify(schemas, null, 2)}

Requirements:
1. For each object:
   - First generate ObjectController_changeObject call to create the object
   - Then generate FieldController_changeField calls for each field
2. Ensure proper ordering of operations
3. Use the correct field types and attributes
4. Set the action as: ${action}

Generate the exact tool calls needed to implement these schemas in the Nflow platform.`;

    const toolCallMessages = [
      {
        role: 'system' as const,
        content: combinedContext,
      },
      {
        role: 'user' as const,
        content: toolCallPrompt,
      },
    ];

    const options = {
      tools: [createNewObjectTool, createNewFieldTool],
      tool_choice: 'auto' as const,
      temperature: 0.5, // Lower temperature for more precise tool calls
      max_tokens: 2000,
    };

    const completion = await this.openAIService.generateFunctionCompletion(
      toolCallMessages,
      options,
    );
    if (!completion.toolCalls?.length) {
      throw new Error(ObjectErrors.TOOL_CALLS_GENERATION_FAILED);
    }

    return completion.toolCalls.map((toolCall, index) => {
      const functionCall = toolCall.function;
      return {
        order: index + 1,
        toolCall: {
          functionName: functionCall.name,
          arguments: JSON.parse(functionCall.arguments) as Record<string, unknown>,
        },
      };
    });
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
