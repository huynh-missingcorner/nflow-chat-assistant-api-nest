import { Injectable } from '@nestjs/common';

import { ChatSessionService } from '@/modules/chat-session/chat-session.service';
import { NFlowObjectService } from '@/modules/nflow/services/object.service';
import { FieldDto } from '@/modules/nflow/types';

import { OBJECT_GRAPH_NODES, OBJECT_LOG_MESSAGES } from '../constants/object-graph.constants';
import type { ApiFormatParserInput } from '../tools/api-format-parser.tool';
import { ObjectExecutionResult, ObjectStateType } from '../types/object-graph-state.types';
import { ObjectGraphNodeBase } from './object-graph-node.base';

interface FieldExecutionStep {
  type: 'create_field' | 'update_field' | 'delete_field' | 'recover_field';
  action: 'create' | 'update' | 'delete' | 'recover';
  fieldData: ApiFormatParserInput['fieldsFormat'][0];
  description: string;
}

@Injectable()
export class FieldExecutorNode extends ObjectGraphNodeBase {
  protected getNodeName(): string {
    return OBJECT_GRAPH_NODES.FIELD_EXECUTOR;
  }

  constructor(
    private readonly chatSessionService: ChatSessionService,
    private readonly nflowObjectService: NFlowObjectService,
  ) {
    super();
  }

  async execute(state: ObjectStateType): Promise<Partial<ObjectStateType>> {
    try {
      this.logger.log(OBJECT_LOG_MESSAGES.FIELD_EXECUTION_COMPLETED);

      const executionPlan = this.buildFieldExecutionPlan(state);

      if (!executionPlan || executionPlan.steps.length === 0) {
        return this.createErrorResult('Unable to build field execution plan from state');
      }

      const executionResult = await this.executeFieldSteps(
        executionPlan.steps,
        state.chatSessionId,
        state,
        state.executionResult || undefined,
      );

      // Always return execution results, regardless of status
      if (executionResult.status === 'failed') {
        // Check if there were any successful operations
        const hasSuccessfulOperations =
          (executionResult.fieldIds && executionResult.fieldIds.length > 0) ||
          (executionResult.completedSteps && executionResult.completedSteps.length > 0);

        if (!hasSuccessfulOperations) {
          return this.createErrorResult(
            executionResult.errors?.join(', ') || 'Field execution failed',
            executionResult,
          );
        } else {
          // Even though status is failed, we have some successful operations
          return this.createExecutionSuccessResult(executionResult);
        }
      }

      // For success and partial status, always return success result
      return this.createExecutionSuccessResult(executionResult);
    } catch (error) {
      this.logger.error('Field execution failed', error);
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Field execution failed',
      );
    }
  }

  private buildFieldExecutionPlan(state: ObjectStateType): { steps: FieldExecutionStep[] } | null {
    try {
      const typeMappingResult = state.typeMappingResult;
      const apiFormat: ApiFormatParserInput | undefined = typeMappingResult?.apiFormat;

      if (!apiFormat) {
        this.logger.error('No API format found in type mapping result');
        return null;
      }

      const steps: FieldExecutionStep[] = [];

      // Only process fields - no object creation in field executor
      if (apiFormat.fieldsFormat && apiFormat.fieldsFormat.length > 0) {
        for (const fieldFormat of apiFormat.fieldsFormat) {
          const action = state.fieldSpec?.action || 'create';
          steps.push({
            type: `${action}_field`,
            action,
            fieldData: fieldFormat,
            description: `${action} field: ${fieldFormat.data.name}`,
          });
        }
      }

      this.logger.debug(`Built field execution plan with ${steps.length} steps`);
      return { steps };
    } catch (error) {
      this.logger.error('Error building field execution plan', error);
      return null;
    }
  }

  private async executeFieldSteps(
    steps: FieldExecutionStep[],
    chatSessionId: string,
    state: ObjectStateType,
    previousResult?: ObjectExecutionResult,
  ): Promise<ObjectExecutionResult> {
    // Initialize result with previous execution data to preserve successful operations across retries
    const result: ObjectExecutionResult = {
      status: 'success',
      fieldIds: [...(previousResult?.fieldIds || [])],
      createdEntities: previousResult?.createdEntities
        ? {
            ...previousResult.createdEntities,
            fields: Array.isArray(previousResult.createdEntities.fields)
              ? [...previousResult.createdEntities.fields]
              : previousResult.createdEntities.fields,
          }
        : {},
      errors: [...(previousResult?.errors || [])],
      completedSteps: [...(previousResult?.completedSteps || [])],
      objectId: previousResult?.objectId, // Preserve object ID from previous operations
    };

    // Get userId from chatSessionId
    let userId: string;
    try {
      userId = await this.getUserId(chatSessionId);
    } catch (error) {
      this.logger.error('Failed to get userId from chatSessionId', error);
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

    try {
      // Execute all field steps
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        this.logger.log(`Executing field step ${i + 1}/${steps.length}: ${step.description}`);

        const stepResult = await this.executeFieldStep(step, userId, state);

        if (!stepResult.success) {
          hasFailedSteps = true;
          if (result.errors) {
            result.errors.push(`Step ${i + 1} failed: ${stepResult.error || 'Unknown error'}`);
          }
          this.logger.warn(`Field step ${i + 1} failed but continuing with remaining steps`);
          continue;
        }

        hasSuccessfulSteps = true;

        // Track completed step
        if (result.completedSteps) {
          result.completedSteps.push({
            type: step.type,
            stepIndex: i,
            entityId: stepResult.fieldId || 'Unknown',
            entityName: stepResult.fieldId || undefined,
          });
        }

        // Collect successful results
        const fieldId = stepResult.fieldId || '';
        if (result.fieldIds && !result.fieldIds.includes(fieldId)) {
          result.fieldIds.push(fieldId);
        }

        if (!result.createdEntities) result.createdEntities = {};
        if (!result.createdEntities.fields) {
          result.createdEntities.fields = [];
        }
        if (Array.isArray(result.createdEntities.fields)) {
          const fieldName = stepResult.fieldId || 'Unknown';
          if (!result.createdEntities.fields.includes(fieldName)) {
            result.createdEntities.fields.push(fieldName);
          }
        }
      }

      // Determine final status
      const hasAnySuccessfulOperations =
        hasSuccessfulSteps ||
        (result.fieldIds && result.fieldIds.length > 0) ||
        (result.completedSteps && result.completedSteps.length > 0);

      if (hasFailedSteps && !hasAnySuccessfulOperations) {
        result.status = 'failed';
      } else if (hasFailedSteps && hasAnySuccessfulOperations) {
        result.status = 'partial';
      } else if (hasAnySuccessfulOperations) {
        result.status = 'success';
      } else {
        result.status = 'failed';
      }

      return result;
    } catch (error) {
      this.logger.error('Error during field step execution', error);
      const errorMessage = error instanceof Error ? error.message : 'Field step execution failed';
      if (result.errors) {
        result.errors.push(errorMessage);
      } else {
        result.errors = [errorMessage];
      }
      result.status = hasSuccessfulSteps ? 'partial' : 'failed';
      return result;
    }
  }

  private async getUserId(chatSessionId: string): Promise<string> {
    return this.chatSessionService.getUserIdFromChatSession(chatSessionId);
  }

  private async executeFieldStep(
    step: FieldExecutionStep,
    userId: string,
    state: ObjectStateType,
  ): Promise<{ success: boolean; fieldId?: string; error?: string }> {
    try {
      this.logger.debug(
        `Executing ${step.type} with data:`,
        JSON.stringify(step.fieldData, null, 2),
      );

      const fieldData = step.fieldData;

      // Initialize object name mapping from state
      const objectNameMapping = new Map<string, string>();

      // Add mappings from state.objectNameMapping (schema-level mappings)
      if (state.objectNameMapping) {
        for (const [originalName, uniqueName] of Object.entries(state.objectNameMapping)) {
          objectNameMapping.set(originalName, uniqueName);
        }
      }

      // Add mappings from created objects in current thread (thread-level mappings)
      if (state.createdObjects && state.createdObjects.length > 0) {
        for (const obj of state.createdObjects) {
          objectNameMapping.set(obj.originalName, obj.uniqueName);
        }
      }

      // Get the correct object name (use mapping if available)
      const objName = objectNameMapping.get(fieldData.objName) || fieldData.objName;

      // For relation fields, also map the target object name
      let fieldValue = fieldData.data.value || undefined;
      if (fieldData.data.typeName === 'relation' && fieldValue) {
        // Check if we have a mapping for the target object
        const mappedTargetObject = objectNameMapping.get(fieldValue);
        if (mappedTargetObject) {
          fieldValue = mappedTargetObject;
          this.logger.debug(
            `Mapped relation target from '${fieldData.data.value}' to '${mappedTargetObject}'`,
          );
        } else {
          this.logger.warn(
            `No mapping found for relation target object '${fieldValue}', using original name`,
          );
        }

        this.logger.debug(
          `Processing relation field '${fieldData.data.name}' with target object '${fieldValue}'`,
        );
      }

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

      // Build the FieldDto according to the NFlow API specification
      const fieldDto: FieldDto = {
        objName: objName,
        action: step.action,
        data: {
          typeName: fieldData.data.typeName,
          name: fieldData.data.name,
          displayName: fieldData.data.displayName,
          value: fieldValue,
          description: fieldData.data.description || undefined,
          pickListId: fieldData.data.pickListId || undefined,
          attributes,
        },
      };

      // For delete operations, the API expects different parameters
      if (step.action === 'delete') {
        const deleteFieldDto = {
          objName: fieldData.objName,
          action: 'delete' as const,
          name: fieldData.data.name, // The API expects the field name directly for delete
          data: {
            name: fieldData.data.name,
            typeName: fieldData.data.typeName,
            displayName: fieldData.data.displayName,
          },
        };

        const result = await this.nflowObjectService.changeField(deleteFieldDto, userId);
        this.logger.log(`Field ${step.action} completed successfully: ${result.name}`);
        return {
          success: true,
          fieldId: result.name,
        };
      }

      // For create, update, recover operations
      const result = await this.nflowObjectService.changeField(fieldDto, userId);

      this.logger.log(`Field ${step.action} completed successfully: ${result.name}`);
      return {
        success: true,
        fieldId: result.name,
      };
    } catch (error) {
      this.logger.error(`Failed to ${step.action} field via API`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : `Field ${step.action} failed`,
      };
    }
  }

  private createErrorResult(
    errorMessage: string,
    executionResult?: ObjectExecutionResult,
  ): Partial<ObjectStateType> {
    return {
      error: `Field execution failed: ${errorMessage}`,
      currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
      executionResult,
    };
  }

  private createExecutionSuccessResult(
    executionResult: ObjectExecutionResult,
  ): Partial<ObjectStateType> {
    return {
      executionResult,
      currentNode: OBJECT_GRAPH_NODES.HANDLE_SUCCESS,
      isCompleted: true,
    };
  }
}
