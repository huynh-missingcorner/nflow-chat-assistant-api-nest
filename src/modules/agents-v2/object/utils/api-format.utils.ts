import {
  FIELD_ACTION_TYPES,
  OBJECT_ACCESS_LEVELS,
  RECORD_NAME_TYPES,
} from '../constants/api-format.constants';
import { NFLOW_DATA_TYPES } from '../constants/object-graph.constants';
import type { DBDesignResult, ObjectSpec } from '../types/object-graph-state.types';

/**
 * Utility functions for converting between internal formats and API formats
 */
export class ApiFormatUtils {
  /**
   * Convert object spec to API format
   */
  static convertObjectToApiFormat(objectSpec: ObjectSpec, designResult: DBDesignResult) {
    const objectFormat = {
      action: FIELD_ACTION_TYPES.CREATE,
      data: {
        name: objectSpec.objectName,
        displayName: designResult.nflowSchema?.displayName || objectSpec.objectName,
        description: objectSpec.description,
        recordName: {
          label: 'Name',
          type: RECORD_NAME_TYPES.TEXT,
        },
        owd: OBJECT_ACCESS_LEVELS.PUBLIC_READ,
      },
    };

    const fieldsFormat = this.buildFieldsFormat(designResult, objectSpec.objectName);

    return {
      objectFormat,
      fieldsFormat,
    };
  }

  /**
   * Build fields format from design result
   */
  static buildFieldsFormat(designResult: DBDesignResult, objectName: string) {
    return (
      designResult.nflowSchema?.fields?.map((field) => ({
        objName: objectName,
        action: 'create' as const,
        data: {
          name: field.name,
          displayName: field.displayName,
          typeName: field.typeName,
          description: field.description,
          value: field.targetObject,
          attributes:
            field.typeName === 'relation'
              ? {
                  onDelete: 'noAction' as const,
                }
              : undefined,
        },
      })) || []
    );
  }

  /**
   * Filter out relation fields from design result
   */
  static filterRelationFields(designResult: DBDesignResult): DBDesignResult {
    if (!designResult?.nflowSchema?.fields) {
      return designResult;
    }

    return {
      ...designResult,
      nflowSchema: {
        ...designResult.nflowSchema,
        fields: designResult.nflowSchema.fields.filter(
          (field) => field.typeName !== NFLOW_DATA_TYPES.RELATION,
        ),
      },
    };
  }
}
