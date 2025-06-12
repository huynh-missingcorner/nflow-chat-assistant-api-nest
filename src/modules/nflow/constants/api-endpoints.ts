/**
 * NFlow API Endpoints Constants
 * Centralized location for all API endpoint URLs to eliminate magic strings
 */

export const NFLOW_API_ENDPOINTS = {
  // Object Management endpoints
  OBJECTS: {
    BASE: '/mo',
    GET_OBJECT: (name: string) => `/mo/${name}`,
    CREATE_UPDATE_OBJECT: '/mo',
    REMOVE_OBJECTS: '/mo/remove',
    GET_FIELDS: (objectName: string) => `/mo/${objectName}/fields`,
    MANAGE_FIELDS: (objectName: string) => `/mo/${objectName}/fields`,
  },

  // Builder Application endpoints
  BUILDER: {
    APPS: {
      BASE: '/builder/apps',
      GET_APP: (name: string) => `/builder/apps/${name}`,
      CREATE_APP: '/builder/apps',
      UPDATE_APP: (name: string) => `/builder/apps/${name}`,
      REMOVE_APPS: '/builder/apps/remove',
    },
    LAYOUTS: {
      CREATE_LAYOUT: '/builder/layouts',
    },
  },

  // Pick List endpoints
  PICK_LISTS: {
    BASE: '/pick-lists',
    GET_PICK_LIST: (name: string) => `/pick-lists/${name}`,
    UPDATE_PICK_LIST: (name: string) => `/pick-lists/${name}`,
    SEARCH_PICK_LISTS: '/pick-lists/search',
    CREATE_PICK_LIST: '/pick-lists',
    ACTIVATE_PICK_LIST: (name: string) => `/pick-lists/${name}/activate`,
    DEACTIVATE_PICK_LIST: (name: string) => `/pick-lists/${name}/deactivate`,
    GET_AUDIT_LOGS: (name: string) => `/pick-lists/${name}/audit-logs`,
    REMOVE_PICK_LISTS: '/pick-lists/remove',
    RECOVER_PICK_LISTS: '/pick-lists/recover',
  },

  // Flow endpoints
  FLOWS: {
    BASE: '/flows',
    CREATE_FLOW: '/flows',
  },
} as const;

/**
 * Type definitions for API endpoints to ensure type safety
 */
export type NFlowApiEndpoints = typeof NFLOW_API_ENDPOINTS;

/**
 * Helper function to get object-related endpoints
 */
export const getObjectEndpoints = () => NFLOW_API_ENDPOINTS.OBJECTS;

/**
 * Helper function to get builder-related endpoints
 */
export const getBuilderEndpoints = () => NFLOW_API_ENDPOINTS.BUILDER;

/**
 * Helper function to get pick list-related endpoints
 */
export const getPickListEndpoints = () => NFLOW_API_ENDPOINTS.PICK_LISTS;

/**
 * Helper function to get flow-related endpoints
 */
export const getFlowEndpoints = () => NFLOW_API_ENDPOINTS.FLOWS;
