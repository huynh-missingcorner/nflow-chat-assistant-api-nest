import { TagResponse } from './common.types';

export interface ObjectDto {
  data: {
    displayName: string;
    recordName: ObjectRecordName;
    owd?: 'PublicRead' | 'PublicReadWrite' | 'Private';
    tagNames?: string[];
    name: string;
    description?: string;
  };
  action: 'create' | 'update' | 'delete' | 'recover';
  name?: string;
}

export interface ObjectRecordName {
  label: string;
  type: 'text';
}

export interface FieldDto {
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
    attributes?: FieldAttributesDto;
    pickListId?: string;
    description?: string;
  };
  updateLayouts?: Array<LayoutComponent>;
}

export interface FieldAttributesDto {
  filters?: Array<Array<FilterItem>>;
  defaultValue?: Record<string, any>;
  onDelete?: 'noAction' | 'setNull' | 'cascade';
  sensitivity?: 'none' | 'partial' | 'all';
  subType: string;
}

export interface LayoutComponent {
  layoutId: string;
  componentIds: string[];
}

export interface ObjectRecordName {
  label: string;
  type: 'text';
}

export interface ObjectResponse {
  id: string;
  name: string;
  isSystemDefault: boolean;
  description?: string;
  displayName: string;
  orgId: number;
  isHidden: boolean;
  isExternal: boolean;
  createdAt?: string;
  updatedAt?: string;
  recordName: ObjectRecordName;
  owd: 'PublicRead' | 'PublicReadWrite' | 'Private';
  tags?: TagResponse[];
}

export interface FilterItem {
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
}

export interface NumberFormat {
  precision?: number;
  locale?: string;
  separator?: string;
  useShorthandNotation?: boolean;
}

export interface FieldAttributes {
  filters?: FilterItem[][];

  defaultValue?: string | number | boolean | object | string[] | number[] | object[] | boolean[];

  onDelete?: 'noAction' | 'setNull' | 'cascade';

  sensitivity?: 'none' | 'partial' | 'all';

  pickListLvl?: number;

  subType?: string;

  template?: string;

  isUnique?: boolean;
  isSearchable?: boolean;
  isSortable?: boolean;
  isReadOnly?: boolean;

  objectNames?: string[];

  includeExtended?: boolean;

  operation?: 'sum' | 'count';

  fileSizeLimit?: number;

  fileTypes?: (
    | 'application/pdf'
    | 'application/msword'
    | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    | 'application/vnd.ms-excel'
    | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    | 'application/vnd.ms-powerpoint'
    | 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    | 'text/plain'
    | 'text/csv'
    | 'text/markdown'
    | 'image/jpeg'
    | 'image/png'
    | 'image/gif'
    | 'video/mp4'
    | 'audio/mpeg'
    | 'video/quicktime'
    | 'video/x-flv'
    | 'video/x-matroska'
    | 'audio/x-ms-wma'
    | 'audio/m4a'
    | 'video/x-m4v'
  )[];

  numberFormat?: NumberFormat;

  formatter?: Record<string, any>;
}

export interface DataTypeResponse {
  name: string;
  id: string;
  systemType:
    | 'numeric'
    | 'text'
    | 'dateTime'
    | 'boolean'
    | 'pickList'
    | 'json'
    | 'generated'
    | 'currency'
    | 'externalRelation'
    | 'indirectRelation'
    | 'relation'
    | 'objectReference'
    | 'flowReference'
    | 'rollup'
    | 'formula'
    | 'file';
  displayName: string;
  attributes: Record<string, any>;
}

export interface FieldResponse {
  id: string;
  name: string;
  displayName: string;
  isRequired: boolean;
  description: string;
  isExternalId: boolean;
  attributes: FieldAttributes;
  isSystemDefault: boolean;
  value?: string;
  pickListId?: string;
  isDeleted: boolean;
  dataType: DataTypeResponse;
  createdAt: string;
  updatedAt: string;
}
