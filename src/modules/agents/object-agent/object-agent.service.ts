import { Injectable } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { ContextLoaderService } from 'src/shared/services/context-loader.service';
import { AGENT_PATHS } from 'src/shared/constants/agent-paths.constants';
import { ObjectAgentInput, ObjectSchema } from './types/object.types';
import { ObjectErrors, ObjectPrompts } from './constants/object.constants';
import { createNewFieldTool, createNewObjectTool, schemaDesignerTool } from './tools/object-tools';
import { ToolChoiceFunction } from 'openai/resources/responses/responses.mjs';
import { BaseAgentService } from '../base-agent.service';
import { AgentInput, AgentOutput, ToolCall } from '../types';

@Injectable()
export class ObjectAgentService extends BaseAgentService<
  AgentInput<ObjectAgentInput>,
  AgentOutput
> {
  private readonly MAX_TOOL_CALL_RETRIES = 2;

  constructor(openAIService: OpenAIService, contextLoader: ContextLoaderService) {
    super(openAIService, contextLoader, AGENT_PATHS.OBJECT);
  }

  async run(input: AgentInput<ObjectAgentInput>): Promise<AgentOutput> {
    return this.generateObjects(input.taskData);
  }

  private async generateObjects(params: ObjectAgentInput): Promise<AgentOutput> {
    try {
      const schemas = await this.designObjectSchemas(params);
      const toolCalls = await this.generateToolCalls(params.action, schemas);

      return {
        toolCalls,
      };
    } catch (error) {
      this.logger.error('Object generation failed', error);
      throw new Error(error instanceof Error ? error.message : ObjectErrors.GENERATION_FAILED);
    }
  }

  private async designObjectSchemas(params: ObjectAgentInput): Promise<ObjectSchema[]> {
    // Load schema design-specific context
    const schemaDesignContext = await this.loadSchemaDesignContext();

    const schemaDesignPrompt = `${ObjectPrompts.OBJECT_DESIGN_PROMPT} ${JSON.stringify(params.objects, null, 2)}`;
    const schemaDesignMessages = [
      {
        role: 'system' as const,
        content: schemaDesignContext,
      },
      {
        role: 'user' as const,
        content: schemaDesignPrompt,
      },
    ];
    const options = {
      tools: [schemaDesignerTool],
      tool_choice: { type: 'function', name: 'SchemaDesigner_designSchema' } as ToolChoiceFunction,
      model: 'gpt-4.1',
      max_output_tokens: 32000,
      temperature: 0.2,
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

  private async generateToolCalls(action: string, schemas: ObjectSchema[]): Promise<ToolCall[]> {
    try {
      const allToolCalls: ToolCall[] = [];

      for (const schema of schemas) {
        let schemaToolCalls: ToolCall[] = [];
        let retryCount = 0;

        // Retry logic for empty tool calls
        while (schemaToolCalls.length === 0 && retryCount < this.MAX_TOOL_CALL_RETRIES) {
          if (retryCount > 0) {
            this.logger.warn(
              `Retry #${retryCount} generating tool calls for schema ${schema.name}`,
            );
          }

          schemaToolCalls = await this.generateCombinedToolCallsPerSchema(schema, action);

          if (schemaToolCalls.length > 0) {
            this.logger.log(
              `Successfully generated ${schemaToolCalls.length} tool calls for schema ${schema.name} on attempt ${retryCount + 1}`,
            );
            break;
          }

          retryCount++;
        }

        if (schemaToolCalls.length === 0) {
          this.logger.error(
            `Failed to generate tool calls for schema ${schema.name} after ${retryCount} attempts`,
          );
        }

        allToolCalls.push(...schemaToolCalls);
      }

      if (allToolCalls.length === 0) {
        throw new Error(ObjectErrors.TOOL_CALLS_GENERATION_FAILED);
      }

      return allToolCalls;
    } catch (error) {
      this.logger.error('Failed to generate tool calls', error);
      throw new Error(ObjectErrors.TOOL_CALLS_GENERATION_FAILED);
    }
  }

  /**
   * Optimized method that generates tool calls for a single schema and all its fields in one API call
   */
  private async generateCombinedToolCallsPerSchema(
    schema: ObjectSchema,
    action: string,
  ): Promise<ToolCall[]> {
    // Load tool generation-specific context
    const toolGenerationContext = await this.loadToolGenerationContext();

    try {
      // Create a combined prompt for the object and all its fields
      const objectData = {
        name: schema.name,
        displayName: schema.displayName,
        description: schema.description,
        primaryField: schema.primaryField,
      };

      const timestamp = Date.now();

      const combinedPrompt = `
Create the following object and all of its fields:

Object: ${JSON.stringify(objectData, null, 2)}

Fields: ${JSON.stringify(schema.fields, null, 2)}

Requirements:
1. First create the object using ObjectController_changeObject
2. Then create each field using FieldController_changeField
3. For each field:
   - Set objName to "${schema.name.toLowerCase()}_${timestamp}"
   - Set action to "${action}"
   - Map field types correctly
   - Include all field attributes
4. For the object:
   - Set action to "${action}"
   - Set name to "${schema.name.toLowerCase()}_${timestamp}"
   - Include all object attributes
5. Important: If any of the parameters are null, do not include them in the tool call arguments.`;

      const messages = [
        {
          role: 'system' as const,
          content: toolGenerationContext,
        },
        {
          role: 'user' as const,
          content: combinedPrompt,
        },
      ];

      const options = {
        tools: [createNewObjectTool, createNewFieldTool],
        tool_choice: 'auto' as const,
        model: 'gpt-4.1',
        max_output_tokens: 32000,
        temperature: 0.2,
      };

      const completion = await this.openAIService.generateFunctionCompletion(messages, options);

      if (!completion.toolCalls?.length) {
        this.logger.warn(`No tool calls generated for schema ${schema.name}`);
        return [];
      }

      const combinedToolCalls = completion.toolCalls.map((toolCall) => ({
        id: toolCall.id,
        functionName: toolCall.function.name,
        arguments: JSON.parse(toolCall.function.arguments) as Record<string, unknown>,
      }));

      this.logger.log(
        `Generated ${combinedToolCalls.length} tool calls for schema ${schema.name} in a single API call`,
      );
      return combinedToolCalls;
    } catch (error) {
      this.logger.error(
        `Failed to generate combined tool calls for schema ${schema.name}`,
        error instanceof Error ? error.stack : String(error),
      );
      return [];
    }
  }

  private async loadSchemaDesignContext(): Promise<string> {
    try {
      // Use loadAgentContexts to load specific files
      const contextPath = `${this.agentPath}/${this.CONTEXTS_PATH}`;
      const contextFiles = await this.contextLoader.loadContextDirectory(contextPath);

      // Filter only schema design files
      const schemaDesignFiles = contextFiles.filter(
        (file) =>
          file.name === 'schema_design_context.md' || file.name === 'schema_design_examples.md',
      );

      return schemaDesignFiles.map((file) => file.content).join('\n\n');
    } catch (error) {
      this.logger.error('Failed to load schema design context', error);
      throw new Error(ObjectErrors.CONTEXT_LOAD_ERROR);
    }
  }

  private async loadToolGenerationContext(): Promise<string> {
    try {
      // Use loadAgentContexts to load specific files
      const contextPath = `${this.agentPath}/${this.CONTEXTS_PATH}`;
      const contextFiles = await this.contextLoader.loadContextDirectory(contextPath);

      // Filter only tool generation files
      const toolGenerationFiles = contextFiles.filter(
        (file) =>
          file.name === 'tool_generation_context.md' || file.name === 'tool_generation_examples.md',
      );

      return toolGenerationFiles.map((file) => file.content).join('\n\n');
    } catch (error) {
      this.logger.error('Failed to load tool generation context', error);
      throw new Error(ObjectErrors.CONTEXT_LOAD_ERROR);
    }
  }
}
