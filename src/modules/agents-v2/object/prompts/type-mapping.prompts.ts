/**
 * Prompts for type mapping and field operation functionality
 * Separated from nodes for better maintainability
 */

import { FieldSpec, ObjectSpec } from '../types/object-graph-state.types';
import { PickListInfo } from '../types/picklist-field.types';

export const TYPE_MAPPER_SYSTEM_PROMPT = `You are an expert in parsing and formatting Nflow data type specifications for API requests.

Your task is to convert object and field specifications into the exact format required by Nflow API calls.

**Nflow API Requirements:**

**Object Format:**
- displayName: User-friendly name
- recordName: {label: string, type: "text"}
- owd: "PublicRead" | "PublicReadWrite" | "Private"
- name: Technical identifier
- description: Optional description

**Field Format:**
- typeName: Nflow data type (numeric, text, dateTime, boolean, pickList, json, etc.)
- name: Technical field name
- displayName: User-friendly field name
- attributes: {subType?: string, onDelete?: string, filters?: array}
- description: Optional field description
- pickListId: For pickList fields
- value: For relation fields (target object name - MUST use unique object name from mapping)

**Type Mapping Rules:**
1. Ensure typeName matches exact Nflow API types
2. Set appropriate subType in attributes based on field usage
3. Handle special configurations for relation and pickList fields
4. Generate proper technical names (camelCase/snake_case)
5. Create user-friendly display names
6. **For relation fields: ALWAYS set the 'value' field to the target object's unique name**

**Validation:**
- All required fields must be present
- Type names must be exact Nflow API types
- Subtypes must be valid for the chosen type
- Relation fields need target object specification and value field
- **Relation fields must have 'value' field set to target object unique name**

Parse the schema and generate exact API-compatible format.`;

export const FIELD_OPERATION_SYSTEM_PROMPT = `You are an expert in NFlow field operations. Convert field specifications into proper field operations.

Key Guidelines:
1. **Type Mapping**: Convert user type hints to correct NFlow types:
   - text/string → "text" with subType "short"/"long"/"rich"
   - number/numeric → "numeric" with subType "integer"/"float"
   - boolean → "boolean"
   - date/datetime → "dateTime" with subType "date"/"time"/"date-time"
   - json → "json"
   - picklist → "pickList" with subType "single"/"multiple" and pickListId if available
   - file → "file"
   - relation → "relation" with proper onDelete and filters

2. **Actions**: Support create, update, delete, recover operations
3. **Attributes**: Set proper subType and additional attributes based on field type
4. **Validation**: Ensure all required fields are present and correctly formatted

Use the FieldOperationTool to generate the field operation specification.`;

export const buildParsingPrompt = (
  nflowSchema: any,
  objectMappings: Map<string, string>,
  createdObjects?: Array<{ originalName: string; uniqueName: string; displayName: string }>,
  objectSpec?: ObjectSpec,
  fieldSpec?: FieldSpec,
  intent?: { intent: string; details?: any },
): string => {
  let prompt =
    'Parse the following Nflow schema into exact API format for changeObject and changeField tools:\n\n';

  // Add Nflow schema information
  prompt += `Nflow Schema: ${JSON.stringify(nflowSchema, null, 2)}\n\n`;

  // Add object mapping context if available
  if (objectMappings.size > 0) {
    prompt += `Available Object Name Mappings:\n`;
    for (const [originalName, uniqueName] of objectMappings) {
      // Try to find display name from created objects
      const createdObj = createdObjects?.find((obj) => obj.originalName === originalName);
      const displayName = createdObj?.displayName || originalName;

      if (displayName !== originalName) {
        prompt += `- "${displayName}" / "${originalName}" → Unique Name: "${uniqueName}"\n`;
      } else {
        prompt += `- "${originalName}" → Unique Name: "${uniqueName}"\n`;
      }
    }
    prompt += '\n';
  }

  // Add context from original requirements
  if (objectSpec) {
    prompt += `Original Requirements:\n`;
    prompt += `- Object Name: ${objectSpec.objectName}\n`;

    if (objectSpec.description) {
      prompt += `- Description: ${objectSpec.description}\n`;
    }

    if (objectSpec.fields) {
      prompt += `- Original Fields:\n`;
      for (const field of objectSpec.fields) {
        prompt += `  * ${field.name} (${field.typeHint})${field.required ? ' - REQUIRED' : ''}\n`;
      }
    }
  }

  // Add field spec context for field-only operations
  if (fieldSpec) {
    prompt += `Field Specification:\n`;
    prompt += `- Field Name: ${fieldSpec.name}\n`;
    prompt += `- Type Hint: ${fieldSpec.typeHint}\n`;
    prompt += `- Required: ${fieldSpec.required || false}\n`;
    prompt += `- Action: ${fieldSpec.action || 'create'}\n`;
    prompt += `- Target Object: ${fieldSpec.objectName}\n`;
    if (fieldSpec.description) {
      prompt += `- Description: ${fieldSpec.description}\n`;
    }
    if (fieldSpec.defaultValue) {
      prompt += `- Default Value: ${JSON.stringify(fieldSpec.defaultValue)}\n`;
    }
  }

  // Add intent context
  if (intent) {
    prompt += `\nOperation: ${intent.intent}\n`;
    if (intent.details) {
      prompt += `Details: ${JSON.stringify(intent.details)}\n`;
    }
  }

  prompt += `\nIMPORTANT INSTRUCTIONS:
1. Convert the type hint "${fieldSpec?.typeHint || 'text'}" to the appropriate NFlow typeName
2. Set the correct subType based on the field requirements
3. Use the action "${fieldSpec?.action || 'create'}" for the field operation
4. Ensure the objName in fieldsFormat matches the target object name exactly
5. For relation fields, use the UNIQUE OBJECT NAME from the mapping above for the 'value' field
6. Parse this into the exact API format required by changeObjectTool and changeFieldTool

Type Conversion Guidelines:
- text/string → typeName: "text", subType: "short"/"long"/"rich" based on length
- number/numeric → typeName: "numeric", subType: "integer"/"float" based on precision
- boolean → typeName: "boolean"
- date/datetime → typeName: "dateTime", subType: "date"/"time"/"date-time"
- json → typeName: "json"
- picklist → typeName: "pickList", subType: "single"/"multiple"
- file → typeName: "file"
- relation → typeName: "relation" (IMPORTANT: set 'value' to the unique target object name from mapping)

CRITICAL FOR RELATION FIELDS:
- When typeName is "relation", the 'value' field MUST contain the unique target object name
- Look up the target object name in the mapping above and use the unique name
- If the field has targetObject property, use that as the value for the relation field
- Example: if user mentions "User" and mapping shows "User" → "user_1234567890", use "user_1234567890" in the value field
- For auto-generated relation fields, use the targetObject property as the value`;

  return prompt;
};

export const buildFieldOperationPrompt = (
  fieldSpec: FieldSpec,
  objectMappings: Map<string, string>,
  createdObjects?: Array<{ originalName: string; uniqueName: string; displayName: string }>,
): string => {
  let prompt = `Convert this field specification into a proper field operation:\n\n`;

  // Add object mapping context if available
  if (objectMappings.size > 0) {
    prompt += `Available Object Name Mappings:\n`;
    for (const [originalName, uniqueName] of objectMappings) {
      // Try to find display name from created objects
      const createdObj = createdObjects?.find((obj) => obj.originalName === originalName);
      const displayName = createdObj?.displayName || originalName;

      if (displayName !== originalName) {
        prompt += `- "${displayName}" / "${originalName}" → Unique Name: "${uniqueName}"\n`;
      } else {
        prompt += `- "${originalName}" → Unique Name: "${uniqueName}"\n`;
      }
    }
    prompt += '\n';
  }

  prompt += `Field Specification:
- Field Name: ${fieldSpec.name}
- Type Hint: ${fieldSpec.typeHint}
- Required: ${fieldSpec.required || false}
- Action: ${fieldSpec.action || 'create'}
- Target Object: ${fieldSpec.objectName}
- Description: ${fieldSpec.description || 'No description provided'}
- Default Value: ${fieldSpec.defaultValue ? JSON.stringify(fieldSpec.defaultValue) : 'None'}`;

  // Add pickList-specific information if available
  if (fieldSpec.pickListInfo) {
    prompt += buildPickListInfoSection(fieldSpec.pickListInfo);
  }

  prompt += `

Requirements:
1. Convert the type hint "${fieldSpec.typeHint}" to the correct NFlow typeName and subType
2. Use action "${fieldSpec.action || 'create'}"
3. Set objName to "${fieldSpec.objectName}" (use unique name from mapping if available)
4. For relation fields, set the 'value' field to the unique target object name from the mapping above
5. Ensure all required attributes are properly configured
6. Handle special type requirements (relations, pickLists, etc.)

CRITICAL FOR PICKLIST FIELDS:
- When typeHint is "pickList" or contains "pickList", set typeName to "pickList"
- If Created PickList ID is available, use it for the pickListId field
- Set proper subType based on requirements ("single" or "multiple")
- Ensure pickListId is included in the field data

CRITICAL FOR RELATION FIELDS:
- When typeHint is "relation", the 'value' field MUST contain the unique target object name
- Look up the target object name in the mapping above and use the unique name
- If no mapping exists, use the original name but log a warning

Convert this specification using the FieldOperationTool.`;

  return prompt;
};

export const buildPickListInfoSection = (pickListInfo: PickListInfo): string => {
  let section = `
- PickList Information:
  - Needs New PickList: ${pickListInfo.needsNewPickList}
  - Created PickList ID: ${pickListInfo.createdPickListId || 'Not available'}
  - PickList Name: ${pickListInfo.pickListName || 'Not specified'}
  - PickList Display Name: ${pickListInfo.pickListDisplayName || 'Not specified'}`;

  if (pickListInfo.pickListItems && pickListInfo.pickListItems.length > 0) {
    section += `
  - PickList Items: ${JSON.stringify(pickListInfo.pickListItems, null, 2)}`;
  }

  return section;
};
