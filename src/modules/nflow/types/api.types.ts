export interface NFlowResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

export interface CreateAppRequest {
  name: string;
  displayName: string;
  description?: string;
}

export interface UpdateAppRequest {
  name: string;
  displayName?: string;
  description?: string;
}

export interface CreateFlowRequest {
  name: string;
  displayName: string;
  description?: string;
  type: 'screen' | 'action' | 'time-based' | 'data' | 'event' | 'ai-chat';
  objectNameRefs?: string[];
  tagNames?: string[];
}

export interface ChangeObjectRequest {
  data: {
    displayName: string;
    recordName: {
      label: string;
      type: 'text';
    };
    owd?: 'PublicRead' | 'PublicReadWrite' | 'Private';
    tagNames?: string[];
    name: string;
    description?: string;
  };
  action: 'create' | 'update' | 'delete' | 'recover';
  name?: string;
}

export interface ChangeFieldRequest {
  objName: string;
  action: 'create' | 'update' | 'delete' | 'recover';
  name?: string;
  data: {
    typeName:
      | 'numeric'
      | 'text'
      | 'dateTime'
      | 'boolean'
      | 'pickList'
      | 'json'
      | 'generated'
      | 'currency'
      | 'externalRelation'
      | 'relation'
      | 'objectReference'
      | 'flowReference'
      | 'rollup'
      | 'file';
    isRequired?: boolean;
    isExternalId?: boolean;
    value?: string;
    pickListName?: string;
    name: string;
    displayName: string;
    attributes?: {
      filters?: Array<
        Array<{
          fieldName: string;
          operator:
            | '==='
            | '!=='
            | 'isIn'
            | 'isNotIn'
            | 'notContains'
            | 'contains'
            | 'between'
            | '<='
            | '>='
            | '<'
            | '>'
            | 'isNull'
            | 'isNotNull';
          value?: string;
        }>
      >;
      defaultValue?: Record<string, any>;
      onDelete?: 'noAction' | 'setNull' | 'cascade';
      sensitivity?: 'none' | 'partial' | 'all';
      subType: string;
    };
    description?: string;
  };
  updateLayouts?: Array<{
    layoutId: string;
    componentIds: string[];
  }>;
}

export interface CreateLayoutRequest {
  name: string;
  displayName: string;
  description?: string;
  type: 'dashboard' | 'app-page' | 'record-page';
  objectName?: string;
  tagNames?: string[];
}

export interface LayoutResponse {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  type: string;
  objectName?: string;
  components: Array<{
    id: string;
    type: string;
    props?: Record<string, any>;
    children?: Array<any>;
  }>;
  tagNames?: string[];
  createdAt: string;
  updatedAt: string;
}
