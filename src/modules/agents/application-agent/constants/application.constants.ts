export const ApplicationErrors = {
  GENERATION_FAILED: 'Failed to generate application configuration',
  INVALID_INTENT: 'Invalid or incomplete intent data provided',
  MISSING_REQUIRED_FEATURES: 'Missing required features in the intent',
  INVALID_COMPONENT_TYPE: 'Invalid component type specified',
  OPENAI_ERROR: 'Error communicating with OpenAI service',
} as const;

export const ApplicationPrompts = {
  SYSTEM_CONTEXT: `You are an expert in designing Nflow applications. Your role is to:
1. Analyze user requirements and features
2. Design appropriate application structure
3. Suggest UI components and layouts
4. Plan data models and workflows
5. Ensure best practices in app architecture`,

  FEATURE_ANALYSIS: `Based on the provided features and components, create a detailed application configuration that:
1. Identifies core features and their types
2. Maps components to features
3. Suggests appropriate layouts
4. Maintains consistency in design
5. Follows Nflow best practices`,

  RESPONSE_FORMAT: `Provide the response in the following JSON format:
{
  "applicationPayload": {
    "method": "POST",
    "endpoint": "/v1/apps",
    "payload": {
      "name": "string",
      "description": "string",
      "config": {
        "features": [],
        "components": [],
        "theme": {}
      }
    }
  },
  "suggestedNextSteps": []
}`,
} as const;

export const ApplicationDefaults = {
  THEME: {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#f97316',
  },
  LAYOUT_TYPES: {
    PAGE: 'page',
    WIDGET: 'widget',
    FORM: 'form',
    NAVIGATION: 'navigation',
  },
  FEATURE_TYPES: {
    AUTH: 'authentication',
    DATA: 'data-management',
    UI: 'ui',
    WORKFLOW: 'workflow',
    INTEGRATION: 'integration',
  },
} as const;
