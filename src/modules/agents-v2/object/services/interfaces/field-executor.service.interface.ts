import type { ApiFormatParserInput } from '@/modules/agents-v2/object/tools/others/api-format-parser.tool';
import {
  ObjectExecutionResult,
  ObjectStateType,
} from '@/modules/agents-v2/object/types/object-graph-state.types';
import { FieldDto, FilterItem } from '@/modules/nflow/types';

export type FieldFormatData = ApiFormatParserInput['fieldsFormat'][0];

export interface FieldAttributes {
  subType?: string;
  onDelete?: 'noAction' | 'setNull' | 'cascade';
  filters?: FilterItem[][];
}

export interface FieldExecutionStep {
  type: 'create_field' | 'update_field' | 'delete_field' | 'recover_field';
  action: 'create' | 'update' | 'delete' | 'recover';
  fieldData: FieldFormatData;
  description: string;
}

export interface FieldExecutionPlan {
  steps: FieldExecutionStep[];
}

export interface FieldStepResult {
  success: boolean;
  fieldId?: string;
  error?: string;
}

export interface ExecutionContext {
  userId: string;
  chatSessionId: string;
  state: ObjectStateType;
  objectNameMapping: Map<string, string>;
}

export interface StepExecutionSummary {
  hasSuccessfulSteps: boolean;
  hasFailedSteps: boolean;
  totalSteps: number;
  completedSteps: number;
}

export interface FieldTransformationContext {
  step: FieldExecutionStep;
  state: ObjectStateType;
  objectNameMapping: Map<string, string>;
}

export type ExecutionStatus = 'success' | 'partial' | 'failed';

export interface IFieldExecutorService {
  /**
   * Builds a field execution plan from the current state
   * @param state - The current object state containing type mapping results
   * @returns Field execution plan with steps to execute, or null if unable to build plan
   */
  buildFieldExecutionPlan(state: ObjectStateType): FieldExecutionPlan | null;

  /**
   * Executes a list of field steps and returns the aggregated result
   * @param steps - Array of field execution steps to perform
   * @param chatSessionId - The chat session identifier for user context
   * @param state - The current object state for context
   * @param previousResult - Optional previous execution result to preserve across retries
   * @returns Promise resolving to the execution result with status and collected data
   */
  executeFieldSteps(
    steps: FieldExecutionStep[],
    chatSessionId: string,
    state: ObjectStateType,
    previousResult?: ObjectExecutionResult,
  ): Promise<ObjectExecutionResult>;

  /**
   * Executes a single field step (create, update, delete, or recover)
   * @param step - The field execution step to perform
   * @param userId - The user identifier for API calls
   * @param state - The current object state for context and mappings
   * @returns Promise resolving to the step result indicating success/failure
   */
  executeFieldStep(
    step: FieldExecutionStep,
    userId: string,
    state: ObjectStateType,
  ): Promise<FieldStepResult>;

  /**
   * Transforms field data to proper FieldDto format for API calls
   * @param step - The field execution step containing field data
   * @param state - The current object state for object name mappings
   * @returns Properly formatted FieldDto for the NFlow API
   */
  transformFieldDataToDto(step: FieldExecutionStep, state: ObjectStateType): FieldDto;

  /**
   * Builds object name mapping from state for field references
   * @param state - The current object state containing name mappings
   * @returns Map of original object names to unique names
   */
  buildObjectNameMapping(state: ObjectStateType): Map<string, string>;
}
