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
  action: 'create' | 'update' | 'remove' | 'recover';
  name: string;
  description: string;
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

export interface ToolCallPayload {
  functionName: string;
  arguments: Record<string, unknown>;
}

export interface ApplicationToolCall {
  order: number;
  toolCall: ToolCallPayload;
  dependsOn?: string[]; // Names of functions this call depends on
}

export interface GenerateApplicationResponse {
  toolCalls: ApplicationToolCall[];
  metadata?: {
    appUrl?: string;
    additionalInfo?: Record<string, unknown>;
  };
}

export interface ExecutorAgentParams {
  toolCalls: ApplicationToolCall[];
  metadata?: Record<string, unknown>;
}

interface OpenAIFunctionCall {
  name: string;
  arguments: string;
}

export interface OpenAIToolCall {
  type: 'function';
  function: OpenAIFunctionCall;
}
