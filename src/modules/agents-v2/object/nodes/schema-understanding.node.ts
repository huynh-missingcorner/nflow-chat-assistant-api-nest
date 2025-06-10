import { Injectable, Logger } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { OPENAI_GPT_4_1_FOR_TOOLS } from '@/shared/infrastructure/langchain/models/openai/openai-models';

import {
  ERROR_TEMPLATES,
  MESSAGE_TEMPLATES,
  OBJECT_GRAPH_NODES,
  VALIDATION_TEMPLATES,
} from '../constants/object-graph.constants';
import { SYSTEM_PROMPTS } from '../constants/system-prompts';
import { SchemaExtractionInput, schemaExtractionTool } from '../tools/schema-extraction.tool';
import { ObjectStateType, SchemaSpec } from '../types/object-graph-state.types';

interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable()
export class SchemaUnderstandingNode {
  private readonly logger = new Logger(SchemaUnderstandingNode.name);

  async execute(state: ObjectStateType): Promise<Partial<ObjectStateType>> {
    try {
      this.logger.log(MESSAGE_TEMPLATES.SCHEMA_UNDERSTANDING_STARTED);

      const schemaSpec = await this.extractSchemaSpecification(state.originalMessage);

      if (!schemaSpec) {
        return this.createErrorResult(ERROR_TEMPLATES.SCHEMA_SPEC_EXTRACTION_FAILED);
      }

      const validationResult = this.validateSchemaSpecification(schemaSpec);
      if (!validationResult.isValid) {
        return this.createErrorResult(
          ERROR_TEMPLATES.SCHEMA_VALIDATION_FAILED(validationResult.errors.join(', ')),
        );
      }

      return this.createSuccessResult(schemaSpec);
    } catch (error) {
      this.logger.error(ERROR_TEMPLATES.SCHEMA_UNDERSTANDING_FAILED, error);
      return this.createErrorResult(
        error instanceof Error ? error.message : ERROR_TEMPLATES.SCHEMA_UNDERSTANDING_FAILED,
      );
    }
  }

  private async extractSchemaSpecification(message: string): Promise<SchemaSpec | null> {
    try {
      const llm = OPENAI_GPT_4_1_FOR_TOOLS.bindTools([schemaExtractionTool]);

      const messages = [
        new SystemMessage(SYSTEM_PROMPTS.SCHEMA_UNDERSTANDING_SYSTEM_PROMPT),
        new HumanMessage(`Extract database schema specification from: ${message}`),
      ];

      const response = await llm.invoke(messages);

      if (!response.tool_calls || response.tool_calls.length === 0) {
        this.logger.error('No tool calls found in schema extraction response');
        return null;
      }

      const toolCall = response.tool_calls[0];
      const extractedSpec = toolCall.args as SchemaExtractionInput;

      // Convert to SchemaSpec format
      const schemaSpec: SchemaSpec = {
        schemaName: extractedSpec.schemaName,
        description: extractedSpec.description,
        objects: extractedSpec.objects.map((obj) => ({
          objectName: obj.objectName,
          description: obj.description,
          fields: obj.fields,
          relationships: obj.relationships,
          metadata: obj.metadata,
        })),
        globalRelationships: extractedSpec.globalRelationships?.map((rel) => ({
          fromObject: rel.fromObject,
          toObject: rel.toObject,
          type: rel.type,
          description: rel.description,
          fieldMapping: rel.fieldMapping,
        })),
        metadata: {
          ...extractedSpec.metadata,
          businessRules: extractedSpec.businessRules,
        },
      };

      this.logger.debug(`Extracted schema specification: ${JSON.stringify(schemaSpec, null, 2)}`);
      return schemaSpec;
    } catch (error) {
      this.logger.error('Error extracting schema specification', error);
      return null;
    }
  }

  private validateSchemaSpecification(schemaSpec: SchemaSpec): SchemaValidationResult {
    const errors: string[] = [];

    if (!schemaSpec.schemaName?.trim()) {
      errors.push(VALIDATION_TEMPLATES.SCHEMA_NAME_REQUIRED);
    }

    if (!schemaSpec.objects || schemaSpec.objects.length === 0) {
      errors.push(VALIDATION_TEMPLATES.SCHEMA_MUST_CONTAIN_OBJECTS);
    }

    // Validate each object
    for (const object of schemaSpec.objects) {
      if (!object.objectName?.trim()) {
        errors.push(VALIDATION_TEMPLATES.ALL_OBJECTS_MUST_HAVE_NAME);
      }

      if (object.fields) {
        for (const field of object.fields) {
          if (!field.name?.trim()) {
            errors.push(
              VALIDATION_TEMPLATES.ALL_FIELDS_MUST_HAVE_NAME(object.objectName || 'unknown'),
            );
          }
          if (!field.typeHint?.trim()) {
            errors.push(
              VALIDATION_TEMPLATES.FIELD_MUST_HAVE_TYPE_HINT(
                field.name || 'unknown',
                object.objectName || 'unknown',
              ),
            );
          }
        }

        // Check for duplicate field names within object
        const fieldNames = object.fields.map((f) => f.name?.toLowerCase()).filter(Boolean);
        const duplicateFields = fieldNames.filter(
          (name, index) => fieldNames.indexOf(name) !== index,
        );
        if (duplicateFields.length > 0) {
          errors.push(VALIDATION_TEMPLATES.DUPLICATE_FIELD_NAMES(duplicateFields.join(', ')));
        }
      }
    }

    // Check for duplicate object names
    const objectNames = schemaSpec.objects
      .map((obj) => obj.objectName?.toLowerCase())
      .filter(Boolean);
    const duplicateObjects = objectNames.filter(
      (name, index) => objectNames.indexOf(name) !== index,
    );
    if (duplicateObjects.length > 0) {
      errors.push(VALIDATION_TEMPLATES.DUPLICATE_OBJECT_NAMES(duplicateObjects.join(', ')));
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

  private createSuccessResult(schemaSpec: SchemaSpec): Partial<ObjectStateType> {
    return {
      schemaSpec,
      isSchemaDesign: true,
      currentNode: OBJECT_GRAPH_NODES.DB_DESIGN,
    };
  }
}
