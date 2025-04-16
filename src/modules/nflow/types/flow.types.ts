import { NameDisplayName, TagResponse } from './common.types';

export interface NFlowResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

export interface FlowCreateDto {
  name: string;
  displayName: string;
  description?: string;
  type: 'screen' | 'action' | 'time-based' | 'data' | 'event' | 'ai-chat';
  objectNameRefs?: string[];
  tagNames?: string[];
}

export interface FlowResponse {
  updatedAt: string;
  id: string;
  name: string;
  type: 'screen' | 'action' | 'time-based' | 'data' | 'event' | 'ai-chat';
  createdAt: string;
  version: string;
  displayName: string;
  status: 'active' | 'inactive' | 'draft';
  triggerType: 'public' | 'private' | 'by-profile';
  profiles?: BasicProfileResponse[];
  attributes: Record<string, any>;
  description?: string;
  objectRefs?: NameDisplayName[];
  tags?: TagResponse[];
}

export interface BasicProfileResponse {
  id: string;
  name: string;
}
