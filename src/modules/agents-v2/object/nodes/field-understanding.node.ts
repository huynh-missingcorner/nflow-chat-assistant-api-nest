import { Injectable } from '@nestjs/common';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

import { ChatSessionService } from '@/modules/chat-session/chat-session.service';
import { NflowPicklistService } from '@/modules/nflow/services/picklist.service';
import { OPENAI_GPT_4_1_FOR_TOOLS } from '@/shared/infrastructure/langchain/models/openai/openai-models';

import { OBJECT_GRAPH_NODES, OBJECT_LOG_MESSAGES } from '../constants/object-graph.constants';
import {
  buildFieldExtractionContextPrompt,
  FIELD_EXTRACTION_SYSTEM_PROMPT,
} from '../prompts/field-extraction.prompts';
import { PickListFieldService } from '../services/picklist-field.service';
import { fieldExtractionTool } from '../tools/fields/field-extraction.tool';
import { pickListAnalysisTool } from '../tools/fields/picklist-analysis.tool';
import { FieldSpec, ObjectStateType } from '../types/object-graph-state.types';
import { ObjectGraphNodeBase } from './object-graph-node.base';

interface ToolCall {
  name: string;
  args: unknown;
}

function isFieldExtractionToolCall(toolCall: unknown): toolCall is ToolCall {
  return (
    typeof toolCall === 'object' &&
    toolCall !== null &&
    'name' in toolCall &&
    'args' in toolCall &&
    (toolCall as ToolCall).name === 'FieldExtractionTool'
  );
}

/**
 * Node responsible for understanding and extracting field specifications from user messages
 * Handles pickList detection and creation through dedicated service
 */
@Injectable()
export class FieldUnderstandingNode extends ObjectGraphNodeBase {
  constructor(
    private readonly chatSessionService: ChatSessionService,
    private readonly picklistService: NflowPicklistService,
    private readonly pickListFieldService: PickListFieldService,
  ) {
    super();
  }

  protected getNodeName(): string {
    return OBJECT_GRAPH_NODES.FIELD_UNDERSTANDING;
  }

  async execute(state: ObjectStateType): Promise<Partial<ObjectStateType>> {
    try {
      this.logger.log(OBJECT_LOG_MESSAGES.FIELD_UNDERSTANDING_COMPLETED);

      const { fieldSpec, newMessages } = await this.extractFieldSpecification(
        state.originalMessage,
        state,
      );

      if (!fieldSpec) {
        return this.createErrorResult('Failed to extract field specification', newMessages);
      }

      // Handle pickList creation if needed
      const { updatedFieldSpec, pickListMessages } = await this.handlePickListCreation(
        fieldSpec,
        state.originalMessage,
        state.chatSessionId,
      );

      const allMessages = [...newMessages, ...pickListMessages];

      return {
        fieldSpec: updatedFieldSpec,
        currentNode: OBJECT_GRAPH_NODES.TYPE_MAPPER,
        messages: allMessages,
      };
    } catch (error) {
      this.logger.error('Field understanding failed', error);
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Field understanding failed',
      );
    }
  }

  /**
   * Extracts basic field specification from user message
   */
  private async extractFieldSpecification(
    message: string,
    state: ObjectStateType,
  ): Promise<{
    fieldSpec: FieldSpec | null;
    newMessages: BaseMessage[];
  }> {
    try {
      const llm = OPENAI_GPT_4_1_FOR_TOOLS.bindTools([fieldExtractionTool, pickListAnalysisTool]);

      const contextualPrompt = this.buildContextualPrompt(message, state);

      const fieldExtractionMessages = [
        new SystemMessage(FIELD_EXTRACTION_SYSTEM_PROMPT),
        new HumanMessage(contextualPrompt),
      ];

      const fieldResponse = await llm.invoke(fieldExtractionMessages);
      const fieldResponseMessage = new AIMessage({
        content: fieldResponse.content,
        id: fieldResponse.id,
        tool_calls: fieldResponse.tool_calls,
      });

      const allMessages: BaseMessage[] = [...fieldExtractionMessages, fieldResponseMessage];

      const fieldToolCall = this.extractFieldToolCall(fieldResponse.tool_calls);
      if (!isFieldExtractionToolCall(fieldToolCall)) {
        this.logger.error('FieldExtractionTool not found in tool calls');
        return { fieldSpec: null, newMessages: allMessages };
      }

      const basicFieldSpec = fieldToolCall.args as FieldSpec;

      // If this might be a pickList field, analyze further
      if (this.pickListFieldService.isPickListField(basicFieldSpec)) {
        const enhancedFieldSpec = await this.enhanceFieldSpecWithPickListAnalysis(
          basicFieldSpec,
          message,
          allMessages,
        );
        return { fieldSpec: enhancedFieldSpec.fieldSpec, newMessages: enhancedFieldSpec.messages };
      }

      return { fieldSpec: basicFieldSpec, newMessages: allMessages };
    } catch (error) {
      this.logger.error('Error extracting field specification', error);
      return { fieldSpec: null, newMessages: [] };
    }
  }

  /**
   * Handles pickList creation workflow
   */
  private async handlePickListCreation(
    fieldSpec: FieldSpec,
    originalMessage: string,
    chatSessionId: string,
  ): Promise<{ updatedFieldSpec: FieldSpec; pickListMessages: BaseMessage[] }> {
    if (!fieldSpec.pickListInfo?.needsNewPickList) {
      return { updatedFieldSpec: fieldSpec, pickListMessages: [] };
    }

    try {
      const validationResult = this.pickListFieldService.validatePickListInfo(
        fieldSpec.pickListInfo,
      );
      if (!validationResult.isValid) {
        this.logger.warn('Invalid pickList info:', validationResult.errors);
        // Continue without pickList creation but log warnings
        return { updatedFieldSpec: fieldSpec, pickListMessages: [] };
      }

      const creationResult = await this.pickListFieldService.createPickListForField(
        fieldSpec.pickListInfo,
        fieldSpec.name,
        fieldSpec.description || '',
        chatSessionId,
      );

      if (!creationResult.success) {
        throw new Error(creationResult.error || 'PickList creation failed');
      }

      // Update field spec with created pickList ID
      const updatedFieldSpec: FieldSpec = {
        ...fieldSpec,
        pickListInfo: {
          ...fieldSpec.pickListInfo,
          createdPickListId: creationResult.pickListId,
        },
      };

      this.logger.log(`Created pickList with ID: ${creationResult.pickListId}`);
      return { updatedFieldSpec, pickListMessages: [] };
    } catch (error) {
      this.logger.error('Failed to create pickList for field', error);
      throw error;
    }
  }

  /**
   * Enhances field specification with pickList analysis
   */
  private async enhanceFieldSpecWithPickListAnalysis(
    basicFieldSpec: FieldSpec,
    message: string,
    existingMessages: BaseMessage[],
  ): Promise<{ fieldSpec: FieldSpec; messages: BaseMessage[] }> {
    try {
      const analysisResult = await this.pickListFieldService.analyzePickListRequirements(
        {
          name: basicFieldSpec.name,
          typeHint: basicFieldSpec.typeHint,
          description: basicFieldSpec.description,
          objectName: basicFieldSpec.objectName,
        },
        message,
      );

      if (analysisResult.isPickListField && analysisResult.needsNewPickList) {
        // Update field spec with pickList information
        const updatedFieldSpec: FieldSpec = {
          ...basicFieldSpec,
          typeHint: 'pickList',
          pickListInfo: {
            needsNewPickList: true,
            pickListName: analysisResult.suggestedPickListName,
            pickListDisplayName: analysisResult.suggestedPickListDisplayName,
            pickListDescription: analysisResult.suggestedPickListDescription,
            pickListItems: analysisResult.extractedItems,
          },
        };

        return { fieldSpec: updatedFieldSpec, messages: existingMessages };
      }

      return { fieldSpec: basicFieldSpec, messages: existingMessages };
    } catch (error) {
      this.logger.error('Error enhancing field spec with pickList analysis', error);
      return { fieldSpec: basicFieldSpec, messages: existingMessages };
    }
  }

  /**
   * Extracts field tool call from response
   */
  private extractFieldToolCall(toolCalls: unknown[] | undefined): unknown {
    if (!toolCalls || toolCalls.length === 0) {
      return null;
    }

    return (
      toolCalls.find((tc) => {
        return (
          typeof tc === 'object' &&
          tc !== null &&
          'name' in tc &&
          (tc as { name: string }).name === 'FieldExtractionTool'
        );
      }) || null
    );
  }

  /**
   * Builds contextual prompt that includes information about created objects
   */
  private buildContextualPrompt(message: string, state: ObjectStateType): string {
    return buildFieldExtractionContextPrompt(
      message,
      state.createdObjects,
      state.intent || undefined,
    );
  }

  /**
   * Creates error result with optional messages
   */
  private createErrorResult(
    errorMessage: string,
    messages?: BaseMessage[],
  ): Partial<ObjectStateType> {
    return {
      error: `Field understanding failed: ${errorMessage}`,
      currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
      messages: messages || [],
    };
  }
}
