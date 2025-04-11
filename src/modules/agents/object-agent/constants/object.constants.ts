export const ObjectErrors = {
  GENERATION_FAILED: 'Failed to generate object definitions',
  INVALID_FEATURES: 'Invalid or incomplete features provided',
  INVALID_FIELD_TYPE: 'Invalid field type specified',
  INVALID_REFERENCE: 'Invalid object reference configuration',
  INVALID_VALIDATION: 'Invalid field validation configuration',
  OPENAI_ERROR: 'Error communicating with OpenAI service',
  CONTEXT_LOAD_ERROR: 'Failed to load agent contexts',
  TOOL_CALLS_GENERATION_FAILED: 'Failed to generate tool calls',
  SCHEMA_DESIGN_FAILED: 'Failed to design object schemas',
} as const;

export const ObjectPrompts = {
  SYSTEM_CONTEXT: `You are an expert in database design and data modeling for Nflow applications. Your role is to:
1. Analyze application features and components
2. Design appropriate data models and relationships
3. Define field types and validations
4. Set up proper indexes and constraints
5. Configure object permissions and security`,

  OBJECT_ANALYSIS: `Based on the provided features and components, create a complete data model that:
1. Captures all necessary entities and relationships
2. Uses appropriate field types and validations
3. Implements proper indexing strategy
4. Ensures data integrity and consistency
5. Follows database design best practices`,

  RESPONSE_FORMAT: `Provide the response in the following JSON format:
{
  "objectPayload": {
    "method": "POST",
    "endpoint": "/v1/objects",
    "payload": {
      "applicationId": "string",
      "objects": [
        {
          "name": "string",
          "description": "string",
          "fields": [],
          "indexes": [],
          "permissions": {}
        }
      ]
    }
  },
  "suggestedNextSteps": []
}`,
  OBJECT_DESIGN_PROMPT: `As a database schema expert, design comprehensive database schemas for the following objects.

Requirements:
1. For each object, provide:
   - Object name and description
   - Primary identifier field
   - All necessary fields with their types and attributes
2. Follow database design best practices
3. Add context-specific fields based on the object type
4. Consider relationships between objects if relevant
5. Important: Do not include any fields like createdAt, updatedAt, guid, etc.

Objects to design:`,

  OBJECT_CREATION_PROMPT: `Generate tool calls to create the following objects in the Nflow platform. For each object, generate an ObjectController_changeObject call with appropriate parameters.

Requirements:
1. Set proper displayName and description
2. Configure recordName settings
3. Set appropriate access level (owd)
4. Include relevant tags if needed
5. Action should be: {action}

Objects to create:
{schemas}`,

  FIELD_CREATION_PROMPT: `Generate tool calls to create fields for the following object schema in the Nflow platform. For each field, generate a FieldController_changeField call with appropriate parameters.

Requirements:
1. Map schema field types to platform field types correctly
2. Set proper displayName and description
3. Configure field attributes based on schema
4. Maintain field order from schema
5. Action should be: {action}

Object Schema:
{schema}`,
} as const;

export const ObjectDefaults = {
  FIELD_TYPES: {
    STRING: 'string',
    NUMBER: 'number',
    BOOLEAN: 'boolean',
    DATE: 'date',
    DATETIME: 'datetime',
    JSON: 'json',
    ARRAY: 'array',
    REFERENCE: 'reference',
  },
  VALIDATION_TYPES: {
    MIN: 'min',
    MAX: 'max',
    PATTERN: 'pattern',
    EMAIL: 'email',
    URL: 'url',
    ENUM: 'enum',
  },
  INDEX_TYPES: {
    UNIQUE: 'unique',
    INDEX: 'index',
  },
  ON_DELETE_ACTIONS: {
    CASCADE: 'CASCADE',
    SET_NULL: 'SET_NULL',
    RESTRICT: 'RESTRICT',
  },
} as const;
