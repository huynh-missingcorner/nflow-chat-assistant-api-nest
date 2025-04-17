import { Injectable } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { ContextLoaderService } from 'src/shared/services/context-loader.service';
import { AGENT_PATHS } from 'src/shared/constants/agent-paths.constants';
import {
  ObjectAgentInput,
  ObjectAgentOutput,
  ObjectSchema,
  ObjectToolCall,
  ToolCallPayload,
} from './types/object.types';
import { ObjectErrors, ObjectPrompts } from './constants/object.constants';
import { createNewFieldTool, createNewObjectTool, schemaDesignerTool } from './tools/object-tools';
import { ToolChoiceFunction } from 'openai/resources/responses/responses.mjs';
import { BaseAgentService } from '../base-agent.service';

@Injectable()
export class ObjectService extends BaseAgentService<ObjectAgentInput, ObjectAgentOutput> {
  constructor(openAIService: OpenAIService, contextLoader: ContextLoaderService) {
    super(openAIService, contextLoader, AGENT_PATHS.OBJECT);
  }

  async run(params: ObjectAgentInput): Promise<ObjectAgentOutput> {
    return this.generateObjects(params);
  }

  private async generateObjects(params: ObjectAgentInput): Promise<ObjectAgentOutput> {
    try {
      const schemas = await this.designObjectSchemas(params);
      const toolCalls = await this.generateToolCalls(params.action, schemas);

      return {
        toolCalls,
        metadata: {},
      };
    } catch (error) {
      this.logger.error('Object generation failed', error);
      throw new Error(error instanceof Error ? error.message : ObjectErrors.GENERATION_FAILED);
    }
  }

  private async designObjectSchemas(params: ObjectAgentInput): Promise<ObjectSchema[]> {
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
      tool_choice: { type: 'function', name: 'SchemaDesigner_designSchema' } as ToolChoiceFunction,
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

  private async generateToolCalls(
    action: string,
    schemas: ObjectSchema[],
  ): Promise<ObjectToolCall[]> {
    try {
      const objectToolCalls = await this.generateObjectCreationCalls(action, schemas);
      const fieldToolCalls = await this.generateFieldCreationCalls(action, schemas);
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
        name: 'ObjectController_changeObject',
      } as ToolChoiceFunction,
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

  private async generateFieldCreationCalls(
    action: string,
    schemas: ObjectSchema[],
  ): Promise<ToolCallPayload[]> {
    const combinedContext = await this.loadAgentContexts();
    const allFieldToolCalls: ToolCallPayload[] = [];

    for (const schema of schemas) {
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
            name: 'FieldController_changeField',
          } as ToolChoiceFunction,
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
}
