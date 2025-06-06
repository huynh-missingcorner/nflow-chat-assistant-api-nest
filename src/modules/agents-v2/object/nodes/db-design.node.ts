import { Injectable, Logger } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { OPENAI_GPT_4_1 } from '@/shared/infrastructure/langchain/models/openai/openai-models';

import { OBJECT_GRAPH_NODES, OBJECT_LOG_MESSAGES } from '../constants/object-graph.constants';
import { SYSTEM_PROMPTS } from '../constants/system-prompts';
import { NflowSchemaDesignInput, nflowSchemaDesignTool } from '../tools/nflow-schema-design.tool';
import { DBDesignResult, ObjectStateType } from '../types/object-graph-state.types';

@Injectable()
export class DBDesignNode {
  private readonly logger = new Logger(DBDesignNode.name);

  async execute(state: ObjectStateType): Promise<Partial<ObjectStateType>> {
    try {
      this.logger.log(OBJECT_LOG_MESSAGES.DB_DESIGN_COMPLETED);

      const dbDesignResult = await this.designNflowSchema(state);

      if (!dbDesignResult.valid) {
        return this.createErrorResult(
          dbDesignResult.conflicts?.join(', ') || 'Schema design validation failed',
          dbDesignResult,
        );
      }

      return this.createSuccessResult(dbDesignResult, state);
    } catch (error) {
      this.logger.error('Schema design failed', error);
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Schema design failed',
      );
    }
  }

  private async designNflowSchema(state: ObjectStateType): Promise<DBDesignResult> {
    try {
      const schema = await this.extractNflowSchema(state);

      if (!schema) {
        return this.createFailedResult(['Failed to design Nflow schema from requirements']);
      }

      const validationResult = this.validateSchemaDesign(schema);

      return {
        valid: validationResult.isValid,
        conflicts: validationResult.errors,
        recommendations: schema.recommendations || [],
        nflowSchema: schema,
      };
    } catch (error) {
      this.logger.error('Error during Nflow schema design', error);
      return this.createFailedResult([
        `Schema design failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ]);
    }
  }

  private async extractNflowSchema(state: ObjectStateType): Promise<NflowSchemaDesignInput | null> {
    try {
      const llm = OPENAI_GPT_4_1.bindTools([nflowSchemaDesignTool]);

      const designPrompt = this.buildDesignPrompt(state);

      const messages = [
        new SystemMessage(SYSTEM_PROMPTS.NFLOW_SCHEMA_DESIGN_SYSTEM_PROMPT),
        new HumanMessage(designPrompt),
      ];

      const response = await llm.invoke(messages);

      if (!response.tool_calls || response.tool_calls.length === 0) {
        this.logger.error('No tool calls found in Nflow schema design response');
        return null;
      }

      const toolCall = response.tool_calls[0];
      const schema = toolCall.args as NflowSchemaDesignInput;

      this.logger.debug(`Designed Nflow schema: ${JSON.stringify(schema, null, 2)}`);
      return schema;
    } catch (error) {
      this.logger.error('Error extracting Nflow schema', error);
      return null;
    }
  }

  private buildDesignPrompt(state: ObjectStateType): string {
    const objectSpec = state.objectSpec;
    const intent = state.intent;

    if (!objectSpec) {
      return `Design Nflow object schema based on: ${state.originalMessage}`;
    }

    let prompt = `Design Nflow schema for: ${objectSpec.objectName}`;

    if (objectSpec.description) {
      prompt += `\nDescription: ${objectSpec.description}`;
    }

    if (objectSpec.fields && objectSpec.fields.length > 0) {
      prompt += '\nRequired fields:';
      for (const field of objectSpec.fields) {
        prompt += `\n- ${field.name} (${field.typeHint})${field.required ? ' - REQUIRED' : ''}`;
        if (field.description) {
          prompt += ` - ${field.description}`;
        }
      }
    }

    if (intent?.details) {
      prompt += `\nAdditional context: ${JSON.stringify(intent.details)}`;
    }

    prompt += `\nDesign a complete Nflow object schema with appropriate data types, subtypes, and field configurations.`;
    prompt += `\nNote: Create a unique object name (primary key) and user-friendly display name. If similar objects might exist, use a distinctive name.`;

    return prompt;
  }

  private validateSchemaDesign(schema: NflowSchemaDesignInput): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate schema structure
    if (!schema.objectName?.trim()) {
      errors.push('Object name is required');
    }

    if (!schema.fields || schema.fields.length === 0) {
      errors.push('Schema must contain at least one field');
    }

    for (const field of schema.fields) {
      const fieldErrors = this.validateField(field);
      errors.push(...fieldErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateField(field: NflowSchemaDesignInput['fields'][0]): string[] {
    const errors: string[] = [];

    if (!field.name?.trim()) {
      errors.push('Field name is required');
    }

    if (!field.typeName) {
      errors.push(`Field '${field.name}' must have a typeName`);
    }

    // Validate subType for specific types
    if (
      field.typeName === 'text' &&
      field.subType &&
      !['short', 'long', 'rich'].includes(field.subType)
    ) {
      errors.push(`Invalid subType '${field.subType}' for text field '${field.name}'`);
    }

    if (
      field.typeName === 'numeric' &&
      field.subType &&
      !['integer', 'float'].includes(field.subType)
    ) {
      errors.push(`Invalid subType '${field.subType}' for numeric field '${field.name}'`);
    }

    if (
      field.typeName === 'dateTime' &&
      field.subType &&
      !['date-time', 'date', 'time'].includes(field.subType)
    ) {
      errors.push(`Invalid subType '${field.subType}' for dateTime field '${field.name}'`);
    }

    if (
      field.typeName === 'pickList' &&
      field.subType &&
      !['single', 'multiple'].includes(field.subType)
    ) {
      errors.push(`Invalid subType '${field.subType}' for pickList field '${field.name}'`);
    }

    // Validate relation fields
    if (field.typeName === 'relation' && !field.targetObject) {
      errors.push(`Relation field '${field.name}' must specify a target object`);
    }

    return errors;
  }

  private createFailedResult(errors: string[]): DBDesignResult {
    return {
      valid: false,
      conflicts: errors,
      recommendations: [],
    };
  }

  private createErrorResult(
    errorMessage: string,
    dbDesignResult?: DBDesignResult,
  ): Partial<ObjectStateType> {
    return {
      error: `Schema design validation failed: ${errorMessage}`,
      currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
      dbDesignResult,
    };
  }

  private createSuccessResult(
    dbDesignResult: DBDesignResult,
    state: ObjectStateType,
  ): Partial<ObjectStateType> {
    return {
      dbDesignResult,
      currentNode: OBJECT_GRAPH_NODES.TYPE_MAPPER,
      messages: [
        ...state.messages,
        new SystemMessage(`Schema design completed: ${JSON.stringify(dbDesignResult)}`),
      ],
    };
  }
}
