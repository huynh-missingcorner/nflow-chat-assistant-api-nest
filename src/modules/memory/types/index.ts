import { ChatMessage, ToolCall } from 'src/modules/agents/types';
import { ExecutionResult } from 'src/modules/agents/executor-agent/types/executor.types';
import { HITLRequest } from 'src/modules/agents/types';
import { IntentPlan } from 'src/modules/agents/intent-agent/types/intent.types';
import {
  BasicProfileResponse,
  DataTypeResponse,
  FieldAttributes,
  NameDisplayName,
  TagResponse,
} from 'src/modules/nflow/types';
import { ObjectRecordName } from 'src/modules/nflow/types';

export interface ShortTermMemory {
  chatSessionId: string;

  // User messages (chat history)
  chatHistory: ChatMessage[];

  // Nflow memory
  createdApplications: CreatedApplication[];
  createdObjects: CreatedObject[];
  createdLayouts: CreatedLayout[];
  createdFlows: CreatedFlow[];

  // Plan memory
  intentPlan?: IntentPlan;
  toolCallsLog: ToolCall[];

  // Task mapping
  taskResults: Record<string, ExecutionResult>;

  // HITL status
  pendingHITL: HITLRequest[];

  // Utility
  timestamp: Date;
}

export interface CreatedApplication {
  id: string;
  name: string; // name is the slugified version of displayName
  displayName: string;
  description?: string;
}

export interface Field {
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

export interface CreatedObject {
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
  fields: Field[];
}

export interface CreatedLayout {
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

export interface CreatedFlow {
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
