/**
 * Types for PickList field creation functionality
 * Separated from main object graph state types for better maintainability
 */

export interface PickListItemInfo {
  name: string;
  displayName: string;
  order?: number;
  action?: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
}

export interface PickListInfo {
  needsNewPickList: boolean;
  pickListName?: string;
  pickListDisplayName?: string;
  pickListDescription?: string;
  pickListItems?: PickListItemInfo[];
  existingPickListId?: string;
  createdPickListId?: string;
}

export interface PickListCreationRequest {
  name: string;
  displayName: string;
  description?: string;
  items: PickListItemInfo[];
}

export interface PickListCreationResult {
  pickListId: string;
  success: boolean;
  error?: string;
}

export interface PickListAnalysisResult {
  isPickListField: boolean;
  needsNewPickList: boolean;
  reasoning: string;
  suggestedPickListName?: string;
  suggestedPickListDisplayName?: string;
  suggestedPickListDescription?: string;
  extractedItems?: PickListItemInfo[];
  confidence: number;
}
