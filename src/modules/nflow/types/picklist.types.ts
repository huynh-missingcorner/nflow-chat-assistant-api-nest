import { TagResponse } from './common.types';

export interface PageInfoType {
  offset: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PickListItemResponse {
  id: string;
  name: string;
  displayName: string;
  isDeprecated: boolean;
  parentName?: string;
  attributes?: Record<string, any>;
  order: number;
}

export interface PickListResponse {
  name: string;
  displayName: string;
  description?: string;
  id: string;
  isActive: boolean;
  itemLabels: string[];
  updatedAt: string;
  viewAttributes?: Record<string, any>;
  items: PickListItemResponse[];
  tags?: TagResponse[];
}

export interface PLResponse {
  name: string;
  displayName: string;
  description?: string;
  id: string;
  isActive: boolean;
  itemLabels: string[];
  updatedAt: string;
  viewAttributes?: Record<string, any>;
  tags?: TagResponse[];
}

export interface PickListCollection {
  data: PLResponse[];
  pageInfo: PageInfoType;
}

export interface PickListQueryParams {
  offset?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'displayName';
  sortOrder?: 'ASC' | 'DESC';
  status?: 'ALL' | 'ACTIVE' | 'INACTIVE';
  searchText?: string;
  tagNames?: string[];
  onlyDeleted?: boolean;
}

export interface MutatePickListItemDto {
  action?: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
  name: string;
  displayName?: string;
  parentName?: string;
  attributes?: Record<string, any>;
  order?: number;
}

export interface CreatePickListDto {
  name: string;
  displayName: string;
  description?: string;
  items?: MutatePickListItemDto[];
  itemLabels?: string[];
  viewAttributes?: Record<string, any>;
  tagNames?: string[];
}

export interface UpdatePickListDto {
  displayName?: string;
  description?: string;
  itemLabels?: string[];
  items?: MutatePickListItemDto[];
  viewAttributes?: Record<string, any>;
  tagNames?: string[];
}

export interface RemovePickListDto {
  names: string[];
}

export interface RecoverPickListDto {
  names: string[];
}

export interface AuditLogResponse {
  id: string;
  action: string;
  userId: string;
  timestamp: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface AuditLogCollection {
  data: AuditLogResponse[];
  pageInfo: PageInfoType;
}

export interface AuditLogQueryParams {
  offset?: number;
  limit?: number;
  sortBy?: 'timestamp';
  sortOrder?: 'ASC' | 'DESC';
  fromDate?: string;
  toDate?: string;
  userId?: string;
  action?: string;
}
