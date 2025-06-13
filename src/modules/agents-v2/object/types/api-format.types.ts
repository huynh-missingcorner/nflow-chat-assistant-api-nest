/**
 * API Format Types
 * Contains type definitions for API format operations
 */

import type {
  API_ACTION_TYPES,
  FIELD_ACTION_TYPES,
  FIELD_SUBTYPES,
  OBJECT_ACCESS_LEVELS,
  OBJECT_ACTION_TYPES,
  RECORD_NAME_TYPES,
  RELATION_ATTRIBUTES,
} from '../constants/api-format.constants';
import type { ApiFormatParserInput } from '../tools/others/api-format-parser.tool';
import type { ExecutionStepType } from './object-graph-state.types';

// Extract types from constants
export type ApiActionType = (typeof API_ACTION_TYPES)[keyof typeof API_ACTION_TYPES];
export type ObjectActionType = (typeof OBJECT_ACTION_TYPES)[keyof typeof OBJECT_ACTION_TYPES];
export type FieldActionType = (typeof FIELD_ACTION_TYPES)[keyof typeof FIELD_ACTION_TYPES];
export type FieldSubType = (typeof FIELD_SUBTYPES)[keyof typeof FIELD_SUBTYPES];
// Re-export NflowDataType from object-graph-state.types to avoid duplication
export type { NflowDataType } from './object-graph-state.types';
export type ObjectAccessLevel = (typeof OBJECT_ACCESS_LEVELS)[keyof typeof OBJECT_ACCESS_LEVELS];
export type RecordNameType = (typeof RECORD_NAME_TYPES)[keyof typeof RECORD_NAME_TYPES];
export type RelationOnDeleteAction =
  (typeof RELATION_ATTRIBUTES.ON_DELETE_ACTIONS)[keyof typeof RELATION_ATTRIBUTES.ON_DELETE_ACTIONS];

// API Format type aliases for better readability
export type ApiObjectFormat = ApiFormatParserInput['objectFormat'];
export type ApiFieldFormat = ApiFormatParserInput['fieldsFormat'][0];
export type ApiFieldsFormat = ApiFormatParserInput['fieldsFormat'];

// Field data type for easier access
export type ApiFieldData = ApiFieldFormat['data'];

// Object data type for easier access
export type ApiObjectData = ApiObjectFormat['data'];

// Relation field attributes type
export interface RelationFieldAttributes {
  subType?: string;
  onDelete?: RelationOnDeleteAction;
  filters?: unknown[];
}

// Field attributes type (union of all possible attributes)
export interface FieldAttributes extends RelationFieldAttributes {
  subType?: string; // Allow any string for flexibility with relation fields
}

// Execution step type for completed steps
export interface ExecutionStep {
  type: ExecutionStepType;
  stepIndex: number;
  entityId: string;
  entityName?: string;
}
