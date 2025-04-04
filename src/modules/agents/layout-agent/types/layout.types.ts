export type LayoutType =
  | 'page'
  | 'section'
  | 'form'
  | 'list'
  | 'detail'
  | 'dashboard'
  | 'calendar'
  | 'kanban'
  | 'table';

export type ComponentType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'textarea'
  | 'richtext'
  | 'file'
  | 'image'
  | 'button'
  | 'link'
  | 'divider'
  | 'container';

export interface LayoutComponent {
  type: ComponentType;
  id: string;
  label?: string;
  placeholder?: string;
  defaultValue?: unknown;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  validation?: {
    type: string;
    params: Record<string, unknown>;
  };
  binding?: {
    object: string;
    field: string;
  };
  style?: Record<string, string>;
  children?: LayoutComponent[];
}

export interface LayoutDefinition {
  name: string;
  type: LayoutType;
  description: string;
  components: LayoutComponent[];
  dataSource?: {
    object: string;
    filter?: Record<string, unknown>;
    sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
  };
  permissions?: {
    view?: string[];
    edit?: string[];
  };
  style?: Record<string, string>;
}

export interface GenerateLayoutsParams {
  features: string[];
  components: string[];
  objects: Array<{
    name: string;
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
    }>;
  }>;
  applicationId: string;
  sessionId: string;
  messageId: string;
}

export interface LayoutPayload {
  method: 'POST';
  endpoint: '/v1/layouts';
  payload: {
    applicationId: string;
    layouts: LayoutDefinition[];
  };
}

export interface GenerateLayoutsResponse {
  layoutPayload: LayoutPayload;
  suggestedNextSteps: Array<{
    agent: 'flow';
    reason: string;
  }>;
}
