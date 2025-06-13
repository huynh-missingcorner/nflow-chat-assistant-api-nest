import { Injectable, Logger } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { ChatSessionService } from '@/modules/chat-session/chat-session.service';
import { NflowPicklistService } from '@/modules/nflow/services/picklist.service';
import { OPENAI_GPT_4_1_FOR_TOOLS } from '@/shared/infrastructure/langchain/models/openai/openai-models';

import {
  buildPickListCreationPrompt,
  PICKLIST_ANALYSIS_SYSTEM_PROMPT,
  PICKLIST_CREATION_SYSTEM_PROMPT,
} from '../prompts/field-extraction.prompts';
import { pickListAnalysisTool } from '../tools/fields/picklist-analysis.tool';
import { createPickListTool } from '../tools/others/create-picklist.tool';
import {
  PickListAnalysisResult,
  PickListCreationRequest,
  PickListCreationResult,
  PickListInfo,
  PickListItemInfo,
} from '../types/picklist-field.types';

/**
 * Service responsible for pickList field operations
 * Handles detection, analysis, and creation of pickLists for fields
 */
@Injectable()
export class PickListFieldService {
  private readonly logger = new Logger(PickListFieldService.name);

  constructor(
    private readonly chatSessionService: ChatSessionService,
    private readonly picklistService: NflowPicklistService,
  ) {}

  /**
   * Determines if a field specification requires pickList creation
   */
  isPickListField(fieldSpec: { typeHint?: string; name?: string }): boolean {
    if (!fieldSpec.typeHint) {
      return false;
    }

    const typeHint = fieldSpec.typeHint.toLowerCase();
    return (
      typeHint.includes('picklist') ||
      typeHint.includes('pick') ||
      typeHint.includes('dropdown') ||
      typeHint.includes('select') ||
      typeHint.includes('option') ||
      typeHint.includes('choice') ||
      typeHint.includes('list')
    );
  }

  /**
   * Analyzes field requirements to determine pickList needs
   */
  async analyzePickListRequirements(
    fieldSpec: { name: string; typeHint: string; description?: string; objectName?: string },
    userMessage: string,
  ): Promise<PickListAnalysisResult> {
    try {
      const llm = OPENAI_GPT_4_1_FOR_TOOLS.bindTools([pickListAnalysisTool]);

      const analysisPrompt = this.buildPickListAnalysisPrompt(fieldSpec, userMessage);

      const messages = [
        new SystemMessage(PICKLIST_ANALYSIS_SYSTEM_PROMPT),
        new HumanMessage(analysisPrompt),
      ];

      const response = await llm.invoke(messages);
      const toolCalls = response.tool_calls;

      if (!toolCalls || toolCalls.length === 0) {
        throw new Error('No tool calls found in pickList analysis response');
      }

      const analysisToolCall = toolCalls.find((tc) => tc.name === 'PickListAnalysisTool');
      if (!analysisToolCall) {
        throw new Error('PickListAnalysisTool not found in response');
      }

      const analysis = analysisToolCall.args as {
        pickListAnalysis: PickListAnalysisResult;
      };

      return analysis.pickListAnalysis;
    } catch (error) {
      this.logger.error('Error analyzing pickList requirements', error);
      throw new Error(
        `PickList analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Creates a new pickList based on field specification
   */
  async createPickListForField(
    pickListInfo: PickListInfo,
    fieldName: string,
    fieldDescription: string,
    chatSessionId: string,
  ): Promise<PickListCreationResult> {
    try {
      if (!pickListInfo.needsNewPickList) {
        throw new Error('PickList creation not required for this field');
      }

      const userId = await this.getUserId(chatSessionId);
      const pickListRequest = this.buildPickListCreationRequest(
        pickListInfo,
        fieldName,
        fieldDescription,
      );

      const pickListId = await this.executePickListCreation(pickListRequest, userId);

      this.logger.log(`Successfully created pickList: ${pickListId} for field: ${fieldName}`);

      return {
        pickListId,
        success: true,
      };
    } catch (error) {
      this.logger.error(`Error creating pickList for field: ${fieldName}`, error);
      return {
        pickListId: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validates pickList information completeness
   */
  validatePickListInfo(pickListInfo: PickListInfo): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!pickListInfo.needsNewPickList) {
      return { isValid: true, errors: [] };
    }

    if (!pickListInfo.pickListName) {
      errors.push('PickList name is required');
    }

    if (!pickListInfo.pickListDisplayName) {
      errors.push('PickList display name is required');
    }

    if (!pickListInfo.pickListItems || pickListInfo.pickListItems.length === 0) {
      errors.push('PickList items are required');
    } else {
      // Validate individual items
      pickListInfo.pickListItems.forEach((item, index) => {
        if (!item.name) {
          errors.push(`PickList item ${index + 1} is missing name`);
        }
        if (!item.displayName) {
          errors.push(`PickList item ${index + 1} is missing display name`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Normalizes pickList items to ensure proper format
   */
  normalizePickListItems(items: PickListItemInfo[]): PickListItemInfo[] {
    return items.map((item, index) => ({
      name: item.name.toLowerCase().replace(/\s+/g, '_'),
      displayName: item.displayName,
      order: item.order || index + 1,
      action: 'CREATE', // Ensure all new items have CREATE action
    }));
  }

  /**
   * Generates default pickList names based on field name
   */
  generatePickListNames(fieldName: string): {
    pickListName: string;
    pickListDisplayName: string;
    pickListDescription: string;
  } {
    const safeName = fieldName.toLowerCase().replace(/\s+/g, '_');
    return {
      pickListName: `${safeName}_options`,
      pickListDisplayName: `${fieldName} Options`,
      pickListDescription: `Options for ${fieldName} field`,
    };
  }

  // Private helper methods

  private async getUserId(chatSessionId: string): Promise<string> {
    return this.chatSessionService.getUserIdFromChatSession(chatSessionId);
  }

  private buildPickListAnalysisPrompt(
    fieldSpec: { name: string; typeHint: string; description?: string; objectName?: string },
    userMessage: string,
  ): string {
    return `Analyze this field specification to determine if it needs pickList creation:
Field: ${JSON.stringify(fieldSpec, null, 2)}
Original user message: ${userMessage}

Determine:
1. Is this definitely a pickList field?
2. Does it need a new pickList to be created?
3. What pickList items can be extracted from the user message?
4. What should the pickList be named?

Use the PickListAnalysisTool to provide your analysis.`;
  }

  private buildPickListCreationRequest(
    pickListInfo: PickListInfo,
    fieldName: string,
    fieldDescription: string,
  ): PickListCreationRequest {
    const defaultNames = this.generatePickListNames(fieldName);

    return {
      name: pickListInfo.pickListName || defaultNames.pickListName,
      displayName: pickListInfo.pickListDisplayName || defaultNames.pickListDisplayName,
      description:
        pickListInfo.pickListDescription || fieldDescription || defaultNames.pickListDescription,
      items: this.normalizePickListItems(pickListInfo.pickListItems || []),
    };
  }

  private async executePickListCreation(
    request: PickListCreationRequest,
    userId: string,
  ): Promise<string> {
    const llm = OPENAI_GPT_4_1_FOR_TOOLS.bindTools([createPickListTool]);

    const creationPrompt = buildPickListCreationPrompt(
      request.name,
      request.description || '',
      request.name,
      request.displayName,
      request.description || '',
      request.items,
    );

    const messages = [
      new SystemMessage(PICKLIST_CREATION_SYSTEM_PROMPT),
      new HumanMessage(creationPrompt),
    ];

    const response = await llm.invoke(messages);
    const toolCalls = response.tool_calls;

    if (!toolCalls || toolCalls.length === 0) {
      throw new Error('No tool calls found in pickList creation response');
    }

    const createPickListCall = toolCalls.find(
      (tc) => tc.name === 'PickListController_createPickList',
    );

    if (!createPickListCall) {
      throw new Error('PickListController_createPickList tool call not found');
    }

    // Execute the actual pickList creation via the service
    const pickListData = createPickListCall.args as {
      name: string;
      displayName: string;
      description?: string;
      items?: Array<{
        name: string;
        displayName: string;
        action?: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
        order?: number;
      }>;
    };

    // Ensure all items have CREATE action
    if (pickListData.items) {
      pickListData.items.forEach((item) => {
        if (!item.action) {
          item.action = 'CREATE';
        }
      });
    }

    const createdPickList = await this.picklistService.createPickList(pickListData, userId);
    return createdPickList.id;
  }
}
