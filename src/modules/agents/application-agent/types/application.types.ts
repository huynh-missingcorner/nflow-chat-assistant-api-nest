export interface ApplicationFeature {
  name: string;
  description: string;
  type: 'authentication' | 'data-management' | 'ui' | 'workflow' | 'integration';
  required: boolean;
}

export interface ApplicationComponent {
  name: string;
  type: 'page' | 'widget' | 'form' | 'navigation';
  features: string[];
  layout?: {
    type: string;
    config: Record<string, unknown>;
  };
}

export interface ApplicationConfig {
  name: string;
  description: string;
  features: ApplicationFeature[];
  components: ApplicationComponent[];
  theme?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface GenerateApplicationParams {
  intent: {
    features: string[];
    components: string[];
    summary: string;
  };
  sessionId: string;
  messageId: string;
}

export interface ApplicationPayload {
  method: 'POST';
  endpoint: '/v1/apps';
  payload: {
    name: string;
    description: string;
    config: ApplicationConfig;
  };
}

export interface GenerateApplicationResponse {
  applicationPayload: ApplicationPayload;
  suggestedNextSteps: Array<{
    agent: 'object' | 'layout' | 'flow';
    reason: string;
  }>;
}
