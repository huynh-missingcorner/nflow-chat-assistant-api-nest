import { Injectable, Logger } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { OPENAI_GPT_4_1 } from '@/shared/infrastructure/langchain/models/openai/openai-models';

import {
  ERROR_TEMPLATES,
  MESSAGE_TEMPLATES,
  NFLOW_DATA_TYPES,
  NFLOW_SUBTYPES,
  OBJECT_GRAPH_NODES,
  VALIDATION_TEMPLATES,
} from '../constants/object-graph.constants';
import { SYSTEM_PROMPTS } from '../constants/system-prompts';
import {
  DatabaseSchemaDesignInput,
  databaseSchemaDesignTool,
} from '../tools/database-schema-design.tool';
import { NflowSchemaDesignInput, nflowSchemaDesignTool } from '../tools/nflow-schema-design.tool';
import {
  DBDesignResult,
  NflowSchemaResult,
  ObjectStateType,
  SchemaDesignResult,
} from '../types/object-graph-state.types';

@Injectable()
export class DBDesignNode {
  private readonly logger = new Logger(DBDesignNode.name);

  async execute(state: ObjectStateType): Promise<Partial<ObjectStateType>> {
    try {
      this.logger.log(MESSAGE_TEMPLATES.DB_DESIGN_COMPLETED);

      // Check if this is schema design or single object design
      if (state.isSchemaDesign && state.schemaSpec) {
        const schemaDesignResult = await this.designDatabaseSchema(state);

        if (!schemaDesignResult.valid) {
          return this.createSchemaErrorResult(
            schemaDesignResult.conflicts?.join(', ') ||
              ERROR_TEMPLATES.SCHEMA_DESIGN_VALIDATION_FAILED('Unknown validation error'),
            schemaDesignResult,
          );
        }

        return this.createSchemaSuccessResult(schemaDesignResult, state);
      } else {
        // Original single object design logic
        const dbDesignResult = await this.designNflowSchema(state);

        if (!dbDesignResult.valid) {
          return this.createErrorResult(
            dbDesignResult.conflicts?.join(', ') ||
              ERROR_TEMPLATES.SCHEMA_DESIGN_VALIDATION_FAILED('Unknown validation error'),
            dbDesignResult,
          );
        }

        return this.createSuccessResult(dbDesignResult, state);
      }
    } catch (error) {
      this.logger.error(ERROR_TEMPLATES.SCHEMA_DESIGN_FAILED, error);
      return this.createErrorResult(
        error instanceof Error ? error.message : ERROR_TEMPLATES.SCHEMA_DESIGN_FAILED,
      );
    }
  }

  private async designNflowSchema(state: ObjectStateType): Promise<DBDesignResult> {
    try {
      const schema = await this.extractNflowSchema(state);

      if (!schema) {
        return this.createFailedResult([ERROR_TEMPLATES.SCHEMA_DESIGN_FAILED]);
      }

      const validationResult = this.validateSchemaDesign(schema);

      return {
        valid: validationResult.isValid,
        conflicts: validationResult.errors,
        recommendations: schema.recommendations || [],
        nflowSchema: schema,
      };
    } catch (error) {
      this.logger.error(ERROR_TEMPLATES.SCHEMA_DESIGN_FAILED, error);
      return this.createFailedResult([
        ERROR_TEMPLATES.SCHEMA_DESIGN_VALIDATION_FAILED(
          error instanceof Error ? error.message : 'Unknown error',
        ),
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
      errors.push(VALIDATION_TEMPLATES.OBJECT_NAME_REQUIRED);
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
      errors.push(VALIDATION_TEMPLATES.FIELD_NAME_REQUIRED);
    }

    if (!field.typeName) {
      errors.push(VALIDATION_TEMPLATES.FIELD_TYPE_NAME_REQUIRED(field.name || 'unknown'));
    }

    // Validate subType for specific types with type-safe comparisons
    if (field.typeName === NFLOW_DATA_TYPES.TEXT && field.subType) {
      const validTextSubtypes = [
        NFLOW_SUBTYPES.TEXT.SHORT,
        NFLOW_SUBTYPES.TEXT.LONG,
        NFLOW_SUBTYPES.TEXT.RICH,
      ] as const;
      if (!validTextSubtypes.includes(field.subType as (typeof validTextSubtypes)[number])) {
        errors.push(
          VALIDATION_TEMPLATES.INVALID_SUBTYPE(
            field.subType,
            field.name || 'unknown',
            NFLOW_DATA_TYPES.TEXT,
          ),
        );
      }
    }

    if (field.typeName === NFLOW_DATA_TYPES.NUMERIC && field.subType) {
      const validNumericSubtypes = [
        NFLOW_SUBTYPES.NUMERIC.INTEGER,
        NFLOW_SUBTYPES.NUMERIC.FLOAT,
      ] as const;
      if (!validNumericSubtypes.includes(field.subType as (typeof validNumericSubtypes)[number])) {
        errors.push(
          VALIDATION_TEMPLATES.INVALID_SUBTYPE(
            field.subType,
            field.name || 'unknown',
            NFLOW_DATA_TYPES.NUMERIC,
          ),
        );
      }
    }

    if (field.typeName === NFLOW_DATA_TYPES.DATE_TIME && field.subType) {
      const validDateTimeSubtypes = [
        NFLOW_SUBTYPES.DATE_TIME.DATE_TIME,
        NFLOW_SUBTYPES.DATE_TIME.DATE,
        NFLOW_SUBTYPES.DATE_TIME.TIME,
      ] as const;
      if (
        !validDateTimeSubtypes.includes(field.subType as (typeof validDateTimeSubtypes)[number])
      ) {
        errors.push(
          VALIDATION_TEMPLATES.INVALID_SUBTYPE(
            field.subType,
            field.name || 'unknown',
            NFLOW_DATA_TYPES.DATE_TIME,
          ),
        );
      }
    }

    if (field.typeName === NFLOW_DATA_TYPES.PICK_LIST && field.subType) {
      const validPickListSubtypes = [
        NFLOW_SUBTYPES.PICK_LIST.SINGLE,
        NFLOW_SUBTYPES.PICK_LIST.MULTIPLE,
      ] as const;
      if (
        !validPickListSubtypes.includes(field.subType as (typeof validPickListSubtypes)[number])
      ) {
        errors.push(
          VALIDATION_TEMPLATES.INVALID_SUBTYPE(
            field.subType,
            field.name || 'unknown',
            NFLOW_DATA_TYPES.PICK_LIST,
          ),
        );
      }
    }

    // Validate relation fields
    if (field.typeName === NFLOW_DATA_TYPES.RELATION && !field.targetObject) {
      errors.push(VALIDATION_TEMPLATES.RELATION_FIELD_TARGET_REQUIRED(field.name || 'unknown'));
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
      error: ERROR_TEMPLATES.SCHEMA_DESIGN_VALIDATION_FAILED(errorMessage),
      currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
      dbDesignResult,
    };
  }

  private async designDatabaseSchema(state: ObjectStateType): Promise<SchemaDesignResult> {
    try {
      if (!state.schemaSpec) {
        throw new Error(ERROR_TEMPLATES.SCHEMA_SPEC_MISSING);
      }

      const schema = await this.extractDatabaseSchema(state);

      if (!schema) {
        return this.createFailedSchemaResult([ERROR_TEMPLATES.SCHEMA_DESIGN_FAILED]);
      }

      const validationResult = this.validateDatabaseSchemaDesign(schema);

      if (!validationResult.isValid) {
        return this.createFailedSchemaResult(validationResult.errors);
      }

      // Convert each object in the schema to a DBDesignResult
      const objectResults: DBDesignResult[] = [];

      for (const obj of schema.objects) {
        const nflowSchemaResult: NflowSchemaResult = {
          objectName: obj.objectName,
          displayName: obj.displayName,
          description: obj.description,
          fields: obj.fields.map((field) => ({
            name: field.name,
            displayName: field.displayName,
            typeName: field.typeName,
            required: field.required,
            subType: field.subType,
            description: field.description,
            targetObject: field.targetObject,
            pickListOptions: field.pickListOptions,
            defaultValue: field.defaultValue,
          })),
          designNotes: schema.designNotes,
          recommendations: schema.recommendations,
          priority: obj.priority,
          dependencies: obj.dependencies,
        };

        const objResult: DBDesignResult = {
          valid: true,
          objectId: obj.objectName,
          conflicts: [],
          recommendations: [],
          nflowSchema: nflowSchemaResult,
        };
        objectResults.push(objResult);
      }

      return {
        valid: true,
        schemaId: schema.schemaName,
        conflicts: [],
        recommendations: schema.recommendations || [],
        objects: objectResults,
        totalObjects: schema.objects.length,
        processedObjects: schema.objects.length,
      };
    } catch (error) {
      this.logger.error(ERROR_TEMPLATES.SCHEMA_DESIGN_FAILED, error);
      return this.createFailedSchemaResult([
        ERROR_TEMPLATES.DATABASE_SCHEMA_DESIGN_VALIDATION_FAILED(
          error instanceof Error ? error.message : 'Unknown error',
        ),
      ]);
    }
  }

  private async extractDatabaseSchema(
    state: ObjectStateType,
  ): Promise<DatabaseSchemaDesignInput | null> {
    try {
      const llm = OPENAI_GPT_4_1.bindTools([databaseSchemaDesignTool]);

      const designPrompt = this.buildSchemaDesignPrompt(state);

      const messages = [
        new SystemMessage(SYSTEM_PROMPTS.DATABASE_SCHEMA_DESIGN_SYSTEM_PROMPT),
        new HumanMessage(designPrompt),
      ];

      const response = await llm.invoke(messages);

      if (!response.tool_calls || response.tool_calls.length === 0) {
        this.logger.error('No tool calls found in database schema design response');
        return null;
      }

      const toolCall = response.tool_calls[0];
      const schema = toolCall.args as DatabaseSchemaDesignInput;

      this.logger.debug(`Designed database schema: ${JSON.stringify(schema, null, 2)}`);
      return schema;
    } catch (error) {
      this.logger.error('Error extracting database schema', error);
      return null;
    }
  }

  private buildSchemaDesignPrompt(state: ObjectStateType): string {
    const schemaSpec = state.schemaSpec;
    const intent = state.intent;

    if (!schemaSpec) {
      return `Design database schema based on: ${state.originalMessage}`;
    }

    let prompt = `Design complete database schema: ${schemaSpec.schemaName}`;

    if (schemaSpec.description) {
      prompt += `\nDescription: ${schemaSpec.description}`;
    }

    if (schemaSpec.objects && schemaSpec.objects.length > 0) {
      prompt += '\nRequired objects:';
      for (const obj of schemaSpec.objects) {
        prompt += `\n\nObject: ${obj.objectName}`;
        if (obj.description) {
          prompt += ` - ${obj.description}`;
        }
        if (obj.fields && obj.fields.length > 0) {
          prompt += '\nFields:';
          for (const field of obj.fields) {
            prompt += `\n  - ${field.name} (${field.typeHint})${field.required ? ' - REQUIRED' : ''}`;
            if (field.description) {
              prompt += ` - ${field.description}`;
            }
          }
        }
      }
    }

    if (schemaSpec.globalRelationships && schemaSpec.globalRelationships.length > 0) {
      prompt += '\n\nRelationships:';
      for (const rel of schemaSpec.globalRelationships) {
        prompt += `\n- ${rel.fromObject} -> ${rel.toObject} (${rel.type})`;
        if (rel.description) {
          prompt += ` - ${rel.description}`;
        }
      }
    }

    if (intent?.details) {
      prompt += `\nAdditional context: ${JSON.stringify(intent.details)}`;
    }

    prompt += `\nDesign a complete database schema with appropriate object creation order, dependencies, and field configurations.`;

    return prompt;
  }

  private validateDatabaseSchemaDesign(schema: DatabaseSchemaDesignInput): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate schema structure
    if (!schema.schemaName?.trim()) {
      errors.push(VALIDATION_TEMPLATES.SCHEMA_NAME_REQUIRED);
    }

    if (!schema.objects || schema.objects.length === 0) {
      errors.push(VALIDATION_TEMPLATES.SCHEMA_MUST_CONTAIN_OBJECTS);
    }

    // Validate creation order
    if (!schema.creationOrder || schema.creationOrder.length === 0) {
      errors.push(VALIDATION_TEMPLATES.CREATION_ORDER_REQUIRED);
    }

    for (const obj of schema.objects) {
      const objErrors = this.validateSchemaObject(obj);
      errors.push(...objErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateSchemaObject(obj: DatabaseSchemaDesignInput['objects'][0]): string[] {
    const errors: string[] = [];

    if (!obj.objectName?.trim()) {
      errors.push(VALIDATION_TEMPLATES.ALL_OBJECTS_MUST_HAVE_NAME);
    }

    if (!obj.fields || obj.fields.length === 0) {
      errors.push(VALIDATION_TEMPLATES.OBJECT_MUST_CONTAIN_FIELDS(obj.objectName || 'unknown'));
    }

    for (const field of obj.fields) {
      const fieldErrors = this.validateField(field);
      errors.push(...fieldErrors.map((err) => `Object '${obj.objectName}': ${err}`));
    }

    return errors;
  }

  private createFailedSchemaResult(errors: string[]): SchemaDesignResult {
    return {
      valid: false,
      conflicts: errors,
      recommendations: [],
      objects: [],
      totalObjects: 0,
      processedObjects: 0,
    };
  }

  private createSchemaErrorResult(
    errorMessage: string,
    schemaDesignResult?: SchemaDesignResult,
  ): Partial<ObjectStateType> {
    return {
      error: ERROR_TEMPLATES.DATABASE_SCHEMA_DESIGN_VALIDATION_FAILED(errorMessage),
      currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
      schemaDesignResult,
    };
  }

  private createSchemaSuccessResult(
    schemaDesignResult: SchemaDesignResult,
    state: ObjectStateType,
  ): Partial<ObjectStateType> {
    return {
      schemaDesignResult,
      currentNode: OBJECT_GRAPH_NODES.SCHEMA_EXECUTOR,
      messages: [
        ...state.messages,
        new SystemMessage(
          `Database schema design completed: ${JSON.stringify(schemaDesignResult)}`,
        ),
      ],
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
