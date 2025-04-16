import { NameDisplayName, TagResponse } from './common.types';

export interface CreateApplicationDto {
  name: string;
  displayName: string;
  description?: string;
  profiles?: string[];
  tagNames?: string[];
  credentials?: string[];
}

export interface UpdateApplicationDto {
  name: string;
  displayName?: string;
  description?: string;
  profiles?: string[];
  tagNames?: string[];
  credentials?: string[];
}

export interface AppProfileResponse {
  id: string;
  name: string;
  displayName: string;
}

export interface BuilderAppResponse {
  customProps?: Record<string, any>;
  displayName: string;
  tags?: TagResponse[];
  credentials?: NameDisplayName[];
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  profiles: AppProfileResponse[];
}
