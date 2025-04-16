import { NameDisplayName, TagResponse } from './common.types';

export interface CreateLayoutDto {
  name: string;
  displayName: string;
  description?: string;
  type: 'dashboard' | 'app-page' | 'record-page';
  objectName?: string;
  tagNames?: string[];
}

export interface LayoutResponse {
  script: Record<string, any>;
  id: string;
  name: string;
  displayName: string;
  description?: string;
  type: 'dashboard' | 'app-page' | 'record-page';
  objectName?: string;
  createdAt: string;
  updatedAt: string;
  tags?: TagResponse[];
  object?: NameDisplayName;
}
