/**
 * API Format Constants
 * Contains constants for API format operations and field configurations
 */

// Action types for objects and fields
export const API_ACTION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  RECOVER: 'recover',
} as const;

// Object action types (subset of API_ACTION_TYPES)
export const OBJECT_ACTION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
} as const;

// Field action types (includes recover)
export const FIELD_ACTION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  RECOVER: 'recover',
} as const;

// Field subtypes for different field types
export const FIELD_SUBTYPES = {
  // Text subtypes
  SHORT: 'short',
  LONG: 'long',
  RICH: 'rich',

  // Numeric subtypes
  INTEGER: 'integer',
  FLOAT: 'float',

  // DateTime subtypes
  DATE_TIME: 'date-time',
  DATE: 'date',
  TIME: 'time',

  // PickList subtypes
  SINGLE: 'single',
  MULTIPLE: 'multiple',
} as const;

// Relation field attributes
export const RELATION_ATTRIBUTES = {
  SUB_TYPES: {
    LOOKUP: 'lookup',
  },
  ON_DELETE_ACTIONS: {
    NO_ACTION: 'noAction',
    SET_NULL: 'setNull',
    CASCADE: 'cascade',
  },
} as const;

// Re-export NFLOW_DATA_TYPES from object-graph.constants to avoid duplication
export { NFLOW_DATA_TYPES } from './object-graph.constants';

// Object access levels
export const OBJECT_ACCESS_LEVELS = {
  PUBLIC_READ: 'PublicRead',
  PUBLIC_READ_WRITE: 'PublicReadWrite',
  PRIVATE: 'Private',
} as const;

// Record name types
export const RECORD_NAME_TYPES = {
  TEXT: 'text',
} as const;
