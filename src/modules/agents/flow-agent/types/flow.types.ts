export type FlowTriggerType =
  | 'form_submit'
  | 'record_created'
  | 'record_updated'
  | 'record_deleted'
  | 'scheduled'
  | 'webhook'
  | 'manual'
  | 'api_call';

export type FlowActionType =
  | 'create_record'
  | 'update_record'
  | 'delete_record'
  | 'send_email'
  | 'send_notification'
  | 'http_request'
  | 'execute_query'
  | 'conditional'
  | 'loop'
  | 'delay'
  | 'transform_data';

export interface FlowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: unknown;
  logicalOperator?: 'AND' | 'OR';
}

export interface FlowTrigger {
  type: FlowTriggerType;
  name: string;
  description: string;
  object?: string;
  conditions?: FlowCondition[];
  schedule?: {
    cron: string;
    timezone: string;
  };
  webhook?: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
  };
}

export interface FlowAction {
  type: FlowActionType;
  name: string;
  description: string;
  object?: string;
  data?: Record<string, unknown>;
  conditions?: FlowCondition[];
  onSuccess?: FlowAction[];
  onError?: FlowAction[];
  retryConfig?: {
    maxAttempts: number;
    backoffMultiplier: number;
  };
}

export interface FlowDefinition {
  name: string;
  description: string;
  trigger: FlowTrigger;
  actions: FlowAction[];
  errorHandling?: {
    onError: FlowAction[];
    notifyOnError?: string[];
  };
  permissions?: {
    execute?: string[];
    edit?: string[];
  };
  enabled: boolean;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

export interface GenerateFlowsParams {
  action: 'create' | 'update' | 'remove' | 'recover';
  name: string;
  description: string;
}

export interface ToolCallPayload {
  functionName: string;
  arguments: Record<string, unknown>;
}

export interface FlowToolCall {
  order: number;
  toolCall: ToolCallPayload;
  dependsOn?: string[];
}

export interface GenerateFlowsResponse {
  toolCalls: FlowToolCall[];
  metadata?: {
    appUrl?: string;
    additionalInfo?: Record<string, unknown>;
  };
}
