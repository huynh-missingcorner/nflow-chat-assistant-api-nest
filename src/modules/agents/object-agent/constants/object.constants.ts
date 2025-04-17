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

  SINGLE_OBJECT_CREATION_PROMPT: `Create an object in the Nflow platform with these specifications:
{schema}

Requirements:
1. Set proper displayName and description
2. Configure recordName settings with appropriate label and type
3. Set appropriate access level (owd)
4. Set action to "{action}"
5. Map the object properties correctly`,

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
