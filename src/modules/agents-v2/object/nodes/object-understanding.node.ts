import { Injectable, Logger } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { OPENAI_GPT_4_1_FOR_TOOLS } from '@/shared/infrastructure/langchain/models/openai/openai-models';

import { OBJECT_GRAPH_NODES, OBJECT_LOG_MESSAGES } from '../constants/object-graph.constants';
import { SYSTEM_PROMPTS } from '../constants/system-prompts';
import { objectExtractionTool } from '../tools/object-extraction.tool';
import { ObjectSpec, ObjectStateType } from '../types/object-graph-state.types';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable()
export class ObjectUnderstandingNode {
  private readonly logger = new Logger(ObjectUnderstandingNode.name);

  async execute(state: ObjectStateType): Promise<Partial<ObjectStateType>> {
    try {
      this.logger.log(OBJECT_LOG_MESSAGES.OBJECT_UNDERSTANDING_COMPLETED);

      const objectSpec = await this.extractObjectSpecification(state.originalMessage);

      if (!objectSpec) {
        return this.createErrorResult('Failed to extract object specification from the message');
      }

      const validationResult = this.validateObjectSpecification(objectSpec);
      if (!validationResult.isValid) {
        return this.createErrorResult(
          `Object specification validation failed: ${validationResult.errors.join(', ')}`,
        );
      }

      return this.createSuccessResult(objectSpec, state);
    } catch (error) {
      this.logger.error('Object understanding failed', error);
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Object understanding failed',
      );
    }
  }

  private async extractObjectSpecification(message: string): Promise<ObjectSpec | null> {
    try {
      const llm = OPENAI_GPT_4_1_FOR_TOOLS.bindTools([objectExtractionTool]);

      const messages = [
        new SystemMessage(SYSTEM_PROMPTS.OBJECT_UNDERSTANDING_SYSTEM_PROMPT),
        new HumanMessage(`Extract object specification from: ${message}`),
      ];

      const response = await llm.invoke(messages);

      if (!response.tool_calls || response.tool_calls.length === 0) {
        this.logger.error('No tool calls found in object extraction response');
        return null;
      }

      const toolCall = response.tool_calls[0];
      const extractedSpec = toolCall.args as ObjectSpec;

      this.logger.debug(
        `Extracted object specification: ${JSON.stringify(extractedSpec, null, 2)}`,
      );
      return extractedSpec;
    } catch (error) {
      this.logger.error('Error extracting object specification', error);
      return null;
    }
  }

  private validateObjectSpecification(objectSpec: ObjectSpec): ValidationResult {
    const errors: string[] = [];

    if (!objectSpec.objectName?.trim()) {
      errors.push('Object name is required');
    }

    if (objectSpec.fields) {
      for (const field of objectSpec.fields) {
        if (!field.name?.trim()) {
          errors.push('All fields must have a name');
        }
        if (!field.typeHint?.trim()) {
          errors.push(`Field '${field.name}' must have a type hint`);
        }
      }

      // Check for duplicate field names
      const fieldNames = objectSpec.fields.map((f) => f.name?.toLowerCase()).filter(Boolean);
      const duplicateFields = fieldNames.filter(
        (name, index) => fieldNames.indexOf(name) !== index,
      );
      if (duplicateFields.length > 0) {
        errors.push(`Duplicate field names found: ${duplicateFields.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private createErrorResult(errorMessage: string): Partial<ObjectStateType> {
    return {
      error: errorMessage,
      currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
    };
  }

  private createSuccessResult(
    objectSpec: ObjectSpec,
    state: ObjectStateType,
  ): Partial<ObjectStateType> {
    return {
      objectSpec,
      currentNode: OBJECT_GRAPH_NODES.DB_DESIGN,
      messages: [
        ...state.messages,
        new SystemMessage(`Object understanding completed: ${JSON.stringify(objectSpec)}`),
      ],
    };
  }
}
