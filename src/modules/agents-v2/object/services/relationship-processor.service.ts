import { Injectable, Logger } from '@nestjs/common';

import {
  NFLOW_DATA_TYPES,
  RELATIONSHIP_FIELD_CONFIG,
  RELATIONSHIP_PROCESSING,
  RELATIONSHIP_TYPES,
  VALIDATION_TEMPLATES,
} from '../constants/object-graph.constants';
import { DatabaseSchemaDesignInput } from '../tools/database-schema-design.tool';

interface RelationField {
  name: string;
  displayName: string;
  typeName: typeof NFLOW_DATA_TYPES.RELATION;
  required: boolean;
  description: string;
  targetObject: string;
}

interface RelationshipProcessingResult {
  success: boolean;
  processedObjects: DatabaseSchemaDesignInput['objects'];
  generatedRelationFields: number;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class RelationshipProcessorService {
  private readonly logger = new Logger(RelationshipProcessorService.name);

  /**
   * Process relationships and automatically generate relation fields in objects
   */
  processRelationships(
    schema: DatabaseSchemaDesignInput,
    objectNameMapping?: Map<string, string>,
  ): RelationshipProcessingResult {
    try {
      if (!schema.relationships || schema.relationships.length === 0) {
        return {
          success: true,
          processedObjects: schema.objects,
          generatedRelationFields: 0,
          errors: [],
          warnings: ['No relationships defined in schema'],
        };
      }

      const errors: string[] = [];
      const warnings: string[] = [];
      let generatedFieldsCount = 0;

      // Create a copy of objects to modify
      const processedObjects = schema.objects.map((obj) => ({ ...obj, fields: [...obj.fields] }));

      // Create object lookup map for validation and field generation
      const objectMap = new Map<string, DatabaseSchemaDesignInput['objects'][0]>();
      processedObjects.forEach((obj) => {
        objectMap.set(obj.objectName, obj);
      });

      // Process each relationship
      for (const relationship of schema.relationships) {
        const relationshipResult = this.processRelationship(
          relationship,
          objectMap,
          objectNameMapping,
        );

        errors.push(...relationshipResult.errors);
        warnings.push(...relationshipResult.warnings);
        generatedFieldsCount += relationshipResult.generatedFields;
      }

      return {
        success: errors.length === 0,
        processedObjects,
        generatedRelationFields: generatedFieldsCount,
        errors,
        warnings,
      };
    } catch (error) {
      this.logger.error('Error processing relationships', error);
      return {
        success: false,
        processedObjects: schema.objects,
        generatedRelationFields: 0,
        errors: [
          `Relationship processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
        warnings: [],
      };
    }
  }

  /**
   * Process a single relationship and generate appropriate relation fields
   */
  private processRelationship(
    relationship: NonNullable<DatabaseSchemaDesignInput['relationships']>[0],
    objectMap: Map<string, DatabaseSchemaDesignInput['objects'][0]>,
    objectNameMapping?: Map<string, string>,
  ): { errors: string[]; warnings: string[]; generatedFields: number } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let generatedFields = 0;

    // Validate relationship
    const validationResult = this.validateRelationship(relationship, objectMap);
    if (!validationResult.isValid) {
      errors.push(...validationResult.errors);
      return { errors, warnings, generatedFields };
    }

    const sourceObject = objectMap.get(relationship.fromObject);
    const targetObject = objectMap.get(relationship.toObject);

    if (!sourceObject || !targetObject) {
      errors.push(
        VALIDATION_TEMPLATES.RELATIONSHIP_TARGET_OBJECT_NOT_FOUND(
          relationship.toObject,
          relationship.fromObject,
        ),
      );
      return { errors, warnings, generatedFields };
    }

    // Generate relation field(s) based on relationship type
    switch (relationship.relationshipType) {
      case RELATIONSHIP_TYPES.ONE_TO_ONE:
      case RELATIONSHIP_TYPES.ONE_TO_MANY:
      case RELATIONSHIP_TYPES.MANY_TO_ONE: {
        // Create relation field in source object
        const relationField = this.generateRelationField(
          relationship,
          sourceObject,
          targetObject,
          objectNameMapping,
        );
        this.addRelationFieldToObject(sourceObject, relationField);
        generatedFields++;
        break;
      }

      case RELATIONSHIP_TYPES.MANY_TO_MANY: {
        // Create relation fields in both objects (bidirectional)
        const sourceToTargetField = this.generateRelationField(
          relationship,
          sourceObject,
          targetObject,
          objectNameMapping,
        );
        this.addRelationFieldToObject(sourceObject, sourceToTargetField);
        generatedFields++;

        // Create reverse relationship field
        const reverseRelationship = {
          ...relationship,
          fromObject: relationship.toObject,
          toObject: relationship.fromObject,
          description: `Reverse ${relationship.description || 'relationship'}`,
        };
        const targetToSourceField = this.generateRelationField(
          reverseRelationship,
          targetObject,
          sourceObject,
          objectNameMapping,
        );
        this.addRelationFieldToObject(targetObject, targetToSourceField);
        generatedFields++;
        break;
      }

      default:
        errors.push(VALIDATION_TEMPLATES.RELATIONSHIP_INVALID_TYPE(relationship.relationshipType));
    }

    return { errors, warnings, generatedFields };
  }

  /**
   * Validate a relationship definition
   */
  private validateRelationship(
    relationship: NonNullable<DatabaseSchemaDesignInput['relationships']>[0],
    objectMap: Map<string, DatabaseSchemaDesignInput['objects'][0]>,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!relationship.fromObject?.trim()) {
      errors.push(
        VALIDATION_TEMPLATES.RELATIONSHIP_SOURCE_OBJECT_REQUIRED(relationship.relationshipType),
      );
    }

    if (!relationship.toObject?.trim()) {
      errors.push(
        VALIDATION_TEMPLATES.RELATIONSHIP_TARGET_OBJECT_REQUIRED(
          relationship.relationshipType,
          relationship.fromObject,
        ),
      );
    }

    if (!objectMap.has(relationship.fromObject)) {
      errors.push(
        VALIDATION_TEMPLATES.RELATIONSHIP_TARGET_OBJECT_NOT_FOUND(
          relationship.fromObject,
          'schema',
        ),
      );
    }

    if (!objectMap.has(relationship.toObject)) {
      errors.push(
        VALIDATION_TEMPLATES.RELATIONSHIP_TARGET_OBJECT_NOT_FOUND(
          relationship.toObject,
          relationship.fromObject,
        ),
      );
    }

    // Check for valid relationship type
    const validTypes = Object.values(RELATIONSHIP_TYPES);
    if (!validTypes.includes(relationship.relationshipType)) {
      errors.push(VALIDATION_TEMPLATES.RELATIONSHIP_INVALID_TYPE(relationship.relationshipType));
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate a relation field based on relationship definition
   */
  private generateRelationField(
    relationship: NonNullable<DatabaseSchemaDesignInput['relationships']>[0],
    sourceObject: DatabaseSchemaDesignInput['objects'][0],
    targetObject: DatabaseSchemaDesignInput['objects'][0],
    objectNameMapping?: Map<string, string>,
  ): RelationField {
    const fieldName = this.generateRelationFieldName(
      relationship.relationshipType,
      targetObject.objectName,
    );
    const displayName = this.generateRelationFieldDisplayName(
      relationship.relationshipType,
      targetObject.displayName,
    );

    // Use mapped unique name if available, otherwise use schema name
    const targetObjectUniqueName =
      objectNameMapping?.get(targetObject.objectName) || targetObject.objectName;

    return {
      name: fieldName,
      displayName,
      typeName: NFLOW_DATA_TYPES.RELATION,
      required: RELATIONSHIP_FIELD_CONFIG.DEFAULT_REQUIRED,
      description:
        relationship.description ||
        RELATIONSHIP_PROCESSING.DEFAULT_RELATION_DESCRIPTION(
          sourceObject.objectName,
          targetObject.objectName,
          relationship.relationshipType,
        ),
      targetObject: targetObjectUniqueName,
    };
  }

  /**
   * Generate relation field name based on relationship type and target object
   */
  private generateRelationFieldName(relationshipType: string, targetObjectName: string): string {
    const cleanTargetName = targetObjectName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');

    switch (relationshipType) {
      case RELATIONSHIP_TYPES.ONE_TO_ONE:
        return RELATIONSHIP_FIELD_CONFIG.FIELD_NAME_PATTERNS.ONE_TO_ONE(cleanTargetName);
      case RELATIONSHIP_TYPES.ONE_TO_MANY:
        return RELATIONSHIP_FIELD_CONFIG.FIELD_NAME_PATTERNS.ONE_TO_MANY(cleanTargetName);
      case RELATIONSHIP_TYPES.MANY_TO_ONE:
        return RELATIONSHIP_FIELD_CONFIG.FIELD_NAME_PATTERNS.ONE_TO_ONE(cleanTargetName); // Same as one-to-one
      case RELATIONSHIP_TYPES.MANY_TO_MANY:
        return RELATIONSHIP_FIELD_CONFIG.FIELD_NAME_PATTERNS.MANY_TO_MANY(cleanTargetName);
      default:
        return cleanTargetName;
    }
  }

  /**
   * Generate relation field display name based on relationship type and target object
   */
  private generateRelationFieldDisplayName(
    relationshipType: string,
    targetDisplayName: string,
  ): string {
    switch (relationshipType) {
      case RELATIONSHIP_TYPES.ONE_TO_ONE:
        return RELATIONSHIP_FIELD_CONFIG.DISPLAY_NAME_PATTERNS.ONE_TO_ONE(targetDisplayName);
      case RELATIONSHIP_TYPES.ONE_TO_MANY:
        return RELATIONSHIP_FIELD_CONFIG.DISPLAY_NAME_PATTERNS.ONE_TO_MANY(targetDisplayName);
      case RELATIONSHIP_TYPES.MANY_TO_ONE:
        return RELATIONSHIP_FIELD_CONFIG.DISPLAY_NAME_PATTERNS.ONE_TO_ONE(targetDisplayName); // Same as one-to-one
      case RELATIONSHIP_TYPES.MANY_TO_MANY:
        return RELATIONSHIP_FIELD_CONFIG.DISPLAY_NAME_PATTERNS.MANY_TO_MANY(targetDisplayName);
      default:
        return `Related ${targetDisplayName}`;
    }
  }

  /**
   * Add relation field to object (avoiding duplicates)
   */
  private addRelationFieldToObject(
    object: DatabaseSchemaDesignInput['objects'][0],
    relationField: RelationField,
  ): void {
    // Check if field with same name already exists
    const existingField = object.fields.find((field) => field.name === relationField.name);
    if (existingField) {
      this.logger.warn(
        `Relation field '${relationField.name}' already exists in object '${object.objectName}', skipping`,
      );
      return;
    }

    // Add the relation field to the object
    object.fields.push(relationField);
    this.logger.debug(
      `Added relation field '${relationField.name}' to object '${object.objectName}' targeting '${relationField.targetObject}'`,
    );
  }
}
