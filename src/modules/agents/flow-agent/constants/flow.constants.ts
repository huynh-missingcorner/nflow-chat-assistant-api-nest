export const FlowErrors = {
  GENERATION_FAILED: 'Failed to generate flow definitions',
  INVALID_FEATURES: 'Invalid or incomplete features provided',
  INVALID_COMPONENTS: 'Invalid components configuration',
  INVALID_OBJECTS: 'Invalid objects configuration',
  INVALID_LAYOUTS: 'Invalid layouts configuration',
  INVALID_TRIGGER_TYPE: 'Invalid trigger type specified',
  INVALID_ACTION_TYPE: 'Invalid action type specified',
  INVALID_CONDITION: 'Invalid condition configuration',
  INVALID_SCHEDULE: 'Invalid schedule configuration',
  INVALID_WEBHOOK: 'Invalid webhook configuration',
  OPENAI_ERROR: 'Error communicating with OpenAI service',
  CONTEXT_LOAD_ERROR: 'Load agent contexts failed',
} as const;

export const FlowPrompts = {
  SYSTEM_CONTEXT: `You are an expert in business process automation and workflow design for Nflow applications. Your role is to:
1. Analyze application features, components, and layouts
2. Design efficient and reliable workflows
3. Create appropriate triggers and actions
4. Configure error handling and retries
5. Set up proper flow permissions and priorities`,

  FLOW_ANALYSIS: `Based on the provided features, components, objects, and layouts, create complete flow definitions that:
1. Automate business processes
2. Handle user interactions
3. Manage data operations
4. Implement error handling
5. Follow workflow best practices`,

  RESPONSE_FORMAT: `Provide the response in the following JSON format:
{
  "flowPayload": {
    "method": "POST",
    "endpoint": "/v1/flows",
    "payload": {
      "applicationId": "string",
      "flows": [
        {
          "name": "string",
          "description": "string",
          "trigger": {},
          "actions": [],
          "errorHandling": {},
          "permissions": {},
          "enabled": true
        }
      ]
    }
  },
  "suggestedNextSteps": []
}`,
} as const;

export const FlowDefaults = {
  TRIGGER_TYPES: {
    FORM_SUBMIT: 'form_submit',
    RECORD_CREATED: 'record_created',
    RECORD_UPDATED: 'record_updated',
    RECORD_DELETED: 'record_deleted',
    SCHEDULED: 'scheduled',
    WEBHOOK: 'webhook',
    MANUAL: 'manual',
    API_CALL: 'api_call',
  },
  ACTION_TYPES: {
    CREATE_RECORD: 'create_record',
    UPDATE_RECORD: 'update_record',
    DELETE_RECORD: 'delete_record',
    SEND_EMAIL: 'send_email',
    SEND_NOTIFICATION: 'send_notification',
    HTTP_REQUEST: 'http_request',
    EXECUTE_QUERY: 'execute_query',
    CONDITIONAL: 'conditional',
    LOOP: 'loop',
    DELAY: 'delay',
    TRANSFORM_DATA: 'transform_data',
  },
  CONDITION_OPERATORS: {
    EQUALS: 'equals',
    NOT_EQUALS: 'not_equals',
    GREATER_THAN: 'greater_than',
    LESS_THAN: 'less_than',
    CONTAINS: 'contains',
    NOT_CONTAINS: 'not_contains',
  },
  LOGICAL_OPERATORS: {
    AND: 'AND',
    OR: 'OR',
  },
  HTTP_METHODS: {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
  },
  PRIORITIES: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  },
} as const;
