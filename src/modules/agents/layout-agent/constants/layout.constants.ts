export const LayoutErrors = {
  GENERATION_FAILED: 'Failed to generate layout definitions',
  INVALID_FEATURES: 'Invalid or incomplete features provided',
  INVALID_COMPONENTS: 'Invalid components configuration',
  INVALID_OBJECTS: 'Invalid objects configuration',
  INVALID_LAYOUT_TYPE: 'Invalid layout type specified',
  INVALID_COMPONENT_TYPE: 'Invalid component type specified',
  INVALID_BINDING: 'Invalid object binding configuration',
  OPENAI_ERROR: 'Error communicating with OpenAI service',
} as const;

export const LayoutPrompts = {
  SYSTEM_CONTEXT: `You are an expert in UI/UX design and layout composition for Nflow applications. Your role is to:
1. Analyze application features and components
2. Design intuitive and user-friendly layouts
3. Create appropriate UI components and forms
4. Configure data bindings and validations
5. Set up proper layout permissions and styling`,

  LAYOUT_ANALYSIS: `Based on the provided features, components, and objects, create complete layout definitions that:
1. Provide an intuitive user interface
2. Use appropriate component types
3. Implement proper data bindings
4. Ensure accessibility and responsiveness
5. Follow UI/UX best practices`,

  RESPONSE_FORMAT: `Provide the response in the following JSON format:
{
  "layoutPayload": {
    "method": "POST",
    "endpoint": "/v1/layouts",
    "payload": {
      "applicationId": "string",
      "layouts": [
        {
          "name": "string",
          "type": "string",
          "description": "string",
          "components": [],
          "dataSource": {},
          "permissions": {},
          "style": {}
        }
      ]
    }
  },
  "suggestedNextSteps": []
}`,
} as const;

export const LayoutDefaults = {
  LAYOUT_TYPES: {
    PAGE: 'page',
    SECTION: 'section',
    FORM: 'form',
    LIST: 'list',
    DETAIL: 'detail',
    DASHBOARD: 'dashboard',
    CALENDAR: 'calendar',
    KANBAN: 'kanban',
    TABLE: 'table',
  },
  COMPONENT_TYPES: {
    TEXT: 'text',
    NUMBER: 'number',
    DATE: 'date',
    SELECT: 'select',
    MULTISELECT: 'multiselect',
    CHECKBOX: 'checkbox',
    RADIO: 'radio',
    TEXTAREA: 'textarea',
    RICHTEXT: 'richtext',
    FILE: 'file',
    IMAGE: 'image',
    BUTTON: 'button',
    LINK: 'link',
    DIVIDER: 'divider',
    CONTAINER: 'container',
  },
  VALIDATION_TYPES: {
    REQUIRED: 'required',
    MIN: 'min',
    MAX: 'max',
    PATTERN: 'pattern',
    EMAIL: 'email',
    URL: 'url',
  },
  SORT_ORDERS: {
    ASC: 'asc',
    DESC: 'desc',
  },
} as const;
