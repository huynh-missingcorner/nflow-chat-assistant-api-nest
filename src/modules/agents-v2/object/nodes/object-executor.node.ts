import { Injectable, Logger } from '@nestjs/common';
import { SystemMessage } from '@langchain/core/messages';

import { ChatSessionService } from '@/modules/chat-session/chat-session.service';
import { NFlowObjectService } from '@/modules/nflow/services/object.service';
import { FieldDto, ObjectDto } from '@/modules/nflow/types';
import { generateUniqueObjectName } from '@/shared/utils';

import { OBJECT_GRAPH_NODES, OBJECT_LOG_MESSAGES } from '../constants/object-graph.constants';
import type { ApiFormatParserInput } from '../tools/api-format-parser.tool';
import { ObjectExecutionResult, ObjectStateType } from '../types/object-graph-state.types';

interface ExecutionStep {
  type: 'create_object' | 'create_field';
  tool: 'changeObject' | 'changeField';
  data: ApiFormatParserInput['objectFormat'] | ApiFormatParserInput['fieldsFormat'][0];
  description: string;
}

@Injectable()
export class ObjectExecutorNode {
  private readonly logger = new Logger(ObjectExecutorNode.name);

  constructor(
    private readonly chatSessionService: ChatSessionService,
    private readonly nflowObjectService: NFlowObjectService,
  ) {}

  async execute(state: ObjectStateType): Promise<Partial<ObjectStateType>> {
    try {
      this.logger.log(OBJECT_LOG_MESSAGES.EXECUTION_COMPLETED);

      const executionSteps = this.buildExecutionPlan(state);

      if (!executionSteps || executionSteps.length === 0) {
        return this.createErrorResult('Unable to build execution plan from state');
      }

      const executionResult = await this.executeSteps(executionSteps, state.chatSessionId);

      // Check if there were any successful operations
      const hasSuccessfulOperations =
        executionResult.objectId ||
        (executionResult.fieldIds && executionResult.fieldIds.length > 0);

      if (executionResult.status === 'failed' && !hasSuccessfulOperations) {
        return this.createErrorResult(
          executionResult.errors?.join(', ') || 'Object execution failed',
          executionResult,
        );
      }

      // If we have partial success or full success, proceed to success handling
      return this.createSuccessResult(executionResult, state);
    } catch (error) {
      this.logger.error('Object execution failed');
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Object execution failed',
      );
    }
  }

  private buildExecutionPlan(state: ObjectStateType): ExecutionStep[] | null {
    try {
      const typeMappingResult = state.typeMappingResult;
      const apiFormat: ApiFormatParserInput | undefined = typeMappingResult?.apiFormat;

      if (!apiFormat) {
        this.logger.error('No API format found in type mapping result');
        return null;
      }

      const steps: ExecutionStep[] = [];

      // Get completed step indices if any exist
      const completedStepIndices: number[] = [];
      if (state.executionResult?.completedSteps) {
        try {
          const completedSteps = state.executionResult.completedSteps;
          if (Array.isArray(completedSteps)) {
            for (const step of completedSteps) {
              if (step && typeof step.stepIndex === 'number') {
                completedStepIndices.push(step.stepIndex);
              }
            }
          }
        } catch {
          this.logger.warn('Error processing completed steps, proceeding with all steps');
        }
      }

      let stepIndex = 0;

      // Step 1: Create object first (only if not already completed)
      if (apiFormat.objectFormat && !completedStepIndices.includes(stepIndex)) {
        steps.push({
          type: 'create_object',
          tool: 'changeObject',
          data: apiFormat.objectFormat,
          description: `Create object: ${apiFormat.objectFormat.name}`,
        });
      }
      stepIndex++;

      // Step 2: Create fields one by one (only if not already completed)
      if (apiFormat.fieldsFormat && apiFormat.fieldsFormat.length > 0) {
        for (const fieldFormat of apiFormat.fieldsFormat) {
          if (!completedStepIndices.includes(stepIndex)) {
            steps.push({
              type: 'create_field',
              tool: 'changeField',
              data: fieldFormat,
              description: `Create field: ${fieldFormat.data.name}`,
            });
          }
          stepIndex++;
        }
      }

      this.logger.debug(
        `Built execution plan with ${steps.length} steps (${completedStepIndices.length} already completed)`,
      );
      return steps;
    } catch {
      this.logger.error('Error building execution plan');
      return null;
    }
  }

  private async executeSteps(
    steps: ExecutionStep[],
    chatSessionId: string,
  ): Promise<ObjectExecutionResult> {
    const result: ObjectExecutionResult = {
      status: 'success',
      fieldIds: [],
      createdEntities: {},
      errors: [],
      completedSteps: [],
    };

    // Get userId from chatSessionId
    let userId: string;
    try {
      userId = await this.getUserId(chatSessionId);
    } catch (error) {
      this.logger.error('Failed to get userId from chatSessionId');
      return {
        status: 'failed',
        errors: [
          `Failed to get user information: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
        fieldIds: [],
        createdEntities: {},
        completedSteps: [],
      };
    }

    let hasSuccessfulSteps = false;
    let hasFailedSteps = false;
    const objectNameMapping = new Map<string, string>(); // Map original object names to unique names

    try {
      // Execute all steps, collecting errors but not stopping
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        this.logger.log(`Executing step ${i + 1}/${steps.length}: ${step.description}`);

        const stepResult = await this.executeStep(step, userId, objectNameMapping);

        if (!stepResult.success) {
          hasFailedSteps = true;
          if (result.errors) {
            result.errors.push(`Step ${i + 1} failed: ${stepResult.error || 'Unknown error'}`);
          }
          this.logger.warn(`Step ${i + 1} failed but continuing with remaining steps`);
          continue; // Continue to next step instead of breaking
        }

        hasSuccessfulSteps = true;

        // Track completed step
        if (result.completedSteps) {
          result.completedSteps.push({
            type: step.type,
            stepIndex: i,
            entityId: stepResult.objectId || stepResult.fieldId || 'Unknown',
            entityName: stepResult.objectId || stepResult.fieldId || undefined,
          });
        }

        // Collect successful results
        if (step.type === 'create_object') {
          result.objectId = stepResult.objectId;
          if (!result.createdEntities) result.createdEntities = {};
          // Use the actual created object name (which is unique)
          result.createdEntities.object = stepResult.objectId || 'Unknown';
        } else if (step.type === 'create_field') {
          if (result.fieldIds) {
            result.fieldIds.push(stepResult.fieldId || '');
          }
          if (!result.createdEntities) result.createdEntities = {};
          if (!result.createdEntities.fields) {
            result.createdEntities.fields = [];
          }
          if (Array.isArray(result.createdEntities.fields)) {
            // Use the actual created field name
            result.createdEntities.fields.push(stepResult.fieldId || 'Unknown');
          }
        }
      }

      // Determine final status based on execution results
      if (hasFailedSteps && !hasSuccessfulSteps) {
        result.status = 'failed';
      } else if (hasFailedSteps && hasSuccessfulSteps) {
        result.status = 'partial';
      } else {
        result.status = 'success';
      }

      return result;
    } catch (error) {
      this.logger.error('Error during step execution');
      return {
        status: 'failed',
        errors: [error instanceof Error ? error.message : 'Step execution failed'],
        fieldIds: [],
        createdEntities: {},
        completedSteps: [],
      };
    }
  }

  /**
   * Get userId from chatSessionId
   * @param chatSessionId The chat session ID
   * @returns userId associated with the chat session
   */
  private async getUserId(chatSessionId: string): Promise<string> {
    return this.chatSessionService.getUserIdFromChatSession(chatSessionId);
  }

  private async executeStep(
    step: ExecutionStep,
    userId: string,
    objectNameMapping: Map<string, string>,
  ): Promise<{ success: boolean; objectId?: string; fieldId?: string; error?: string }> {
    try {
      this.logger.debug(`Executing ${step.type} with data:`, JSON.stringify(step.data, null, 2));

      if (step.type === 'create_object') {
        return await this.executeObjectCreation(step, userId, objectNameMapping);
      } else if (step.type === 'create_field') {
        return await this.executeFieldCreation(step, userId, objectNameMapping);
      }

      return { success: false, error: `Unknown step type: ${step.type as string}` };
    } catch (error) {
      this.logger.error(`Error executing step: ${step.description}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Step execution failed',
      };
    }
  }

  private async executeObjectCreation(
    step: ExecutionStep,
    userId: string,
    objectNameMapping: Map<string, string>,
  ): Promise<{ success: boolean; objectId?: string; error?: string }> {
    try {
      const objectData = step.data as ApiFormatParserInput['objectFormat'];

      // Generate unique name to ensure uniqueness in the NFlow platform
      const uniqueName = generateUniqueObjectName(objectData.data.name);

      // Store the mapping between original name and unique name
      objectNameMapping.set(objectData.data.name, uniqueName);

      const objectDto: ObjectDto = {
        data: {
          displayName: objectData.data.displayName,
          recordName: {
            label: objectData.data.recordName.label,
            type: objectData.data.recordName.type,
          },
          owd: objectData.data.owd || 'PublicRead',
          name: uniqueName,
          description: objectData.data.description || undefined,
        },
        action: objectData.action,
        name: uniqueName,
      };

      const result = await this.nflowObjectService.changeObject(objectDto, userId);

      this.logger.log(`Object created successfully: ${result.name}`);
      return {
        success: true,
        objectId: result.name, // Using name as objectId since that's what the API returns
      };
    } catch (error) {
      this.logger.error('Failed to create object via API');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Object creation failed',
      };
    }
  }

  private async executeFieldCreation(
    step: ExecutionStep,
    userId: string,
    objectNameMapping: Map<string, string>,
  ): Promise<{ success: boolean; fieldId?: string; error?: string }> {
    try {
      const fieldData = step.data as ApiFormatParserInput['fieldsFormat'][0];

      // Get the correct object name (use unique name if it exists, otherwise use original)
      const correctObjectName = objectNameMapping.get(fieldData.objName) || fieldData.objName;

      // Properly transform attributes to match FieldAttributesDto
      const attributes = fieldData.data.attributes
        ? {
            subType: fieldData.data.attributes.subType,
            onDelete: fieldData.data.attributes.onDelete as
              | 'noAction'
              | 'setNull'
              | 'cascade'
              | undefined,
            filters: fieldData.data.attributes.filters as Array<Array<any>> | undefined,
          }
        : undefined;

      const fieldDto: FieldDto = {
        objName: correctObjectName, // Use the unique object name
        action: fieldData.action,
        data: {
          typeName: fieldData.data.typeName,
          name: fieldData.data.name, // Use original field name (no need to make it unique)
          displayName: fieldData.data.displayName,
          value: fieldData.data.value || undefined, // Convert null to undefined
          description: fieldData.data.description || undefined, // Convert null to undefined
          pickListId: fieldData.data.pickListId || undefined, // Convert null to undefined
          attributes,
        },
      };

      const result = await this.nflowObjectService.changeField(fieldDto, userId);

      this.logger.log(`Field created successfully: ${result.name}`);
      return {
        success: true,
        fieldId: result.name, // Using name as fieldId since that's what the API returns
      };
    } catch (error) {
      this.logger.error('Failed to create field via API');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Field creation failed',
      };
    }
  }

  private createErrorResult(
    errorMessage: string,
    executionResult?: ObjectExecutionResult,
  ): Partial<ObjectStateType> {
    return {
      error: `Object execution failed: ${errorMessage}`,
      currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
      executionResult,
    };
  }

  private createSuccessResult(
    executionResult: ObjectExecutionResult,
    state: ObjectStateType,
  ): Partial<ObjectStateType> {
    return {
      executionResult,
      currentNode: OBJECT_GRAPH_NODES.HANDLE_SUCCESS,
      isCompleted: true,
      messages: [
        ...state.messages,
        new SystemMessage(`Object execution completed: ${JSON.stringify(executionResult)}`),
      ],
    };
  }
}
