import { Injectable } from '@nestjs/common';

import type {
  CoordinatorStateType,
  IntentError,
  ObjectIntentResult,
} from '@/modules/agents-v2/coordinator/types/graph-state.types';
import { RESET_MARKER } from '@/modules/agents-v2/coordinator/types/graph-state.types';
import type {
  IntentDetails,
  SubgraphHandler,
  ValidationResult,
} from '@/modules/agents-v2/coordinator/types/subgraph-handler.types';
import type {
  CreatedObjectInfo,
  ObjectExecutionResult,
  ObjectNameMapping,
  ObjectStateType,
} from '@/modules/agents-v2/object/types/object-graph-state.types';

@Injectable()
export class ObjectSubgraphHandler implements SubgraphHandler<ObjectStateType> {
  validateContext(state: CoordinatorStateType): ValidationResult {
    const errors: string[] = [];

    if (!state.originalMessage) {
      errors.push('Original message is required for object domain');
    }

    if (!state.classifiedIntent) {
      errors.push('Classified intent is required for object domain');
    }

    if (typeof state.currentIntentIndex !== 'number' || state.currentIntentIndex < 0) {
      errors.push('Valid current intent index is required for object domain');
    }

    const currentIntent = state.classifiedIntent?.intents[state.currentIntentIndex];
    if (!currentIntent) {
      errors.push('Current intent is required for object domain');
    }

    if (currentIntent && currentIntent.domain !== 'object') {
      errors.push(`Expected object domain, got: ${currentIntent.domain}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  buildSubgraphMessage(intent: IntentDetails, originalMessage: string): string {
    // Build a focused message for the object subgraph based on intent
    const intentMap: Record<string, string> = {
      create_object: `Create object: ${originalMessage}`,
      manipulate_object_fields: `Manipulate object fields: ${originalMessage}`,
      update_object_metadata: `Update object metadata: ${originalMessage}`,
      design_data_schema: `Design data schema: ${originalMessage}`,
      delete_object: `Delete object: ${originalMessage}`,
    };

    const baseMessage = intentMap[intent.intent] || originalMessage;

    // Add details if available
    const intentDetails = intent.details ? ` Details: ${JSON.stringify(intent.details)}` : '';
    const targetInfo = intent.target
      ? ` Target: ${Array.isArray(intent.target) ? intent.target.join(', ') : intent.target}`
      : '';

    return `${baseMessage}${targetInfo}${intentDetails}`;
  }

  validateSubgraphResults(subgraphOutput: ObjectStateType): ValidationResult {
    const errors: string[] = [];

    if (!subgraphOutput) {
      errors.push('Object subgraph output is required');
      return { isValid: false, errors };
    }

    // Check if we have proper completion status
    if (!subgraphOutput.isCompleted && !subgraphOutput.error) {
      errors.push('Object processing should be completed or have an error');
    }

    // For completions, validate execution results
    if (subgraphOutput.isCompleted) {
      if (!subgraphOutput.executionResult) {
        errors.push('Completed object processing should have execution result');
      } else {
        // Allow for partial successes - validate that we have some useful results
        const executionResult = subgraphOutput.executionResult;
        const hasAnyResults =
          executionResult.objectId ||
          (executionResult.fieldIds && executionResult.fieldIds.length > 0) ||
          (executionResult.completedSteps && executionResult.completedSteps.length > 0) ||
          (executionResult.createdEntities &&
            Object.keys(executionResult.createdEntities).length > 0);

        // Only flag as error if execution failed AND no results were produced
        if (executionResult.status === 'failed' && !hasAnyResults && !subgraphOutput.error) {
          errors.push('Object execution marked as failed but no error or results provided');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  transformToSubgraphState(state: CoordinatorStateType): Partial<ObjectStateType> {
    const currentIntent = state.classifiedIntent?.intents[state.currentIntentIndex];
    if (!currentIntent) {
      throw new Error('No current intent found for object subgraph transformation');
    }

    const subgraphMessage = this.buildSubgraphMessage(currentIntent, state.originalMessage);

    // Transform objectResults to createdObjects and objectNameMapping
    const { createdObjects, objectNameMapping } = this.transformObjectResults(
      state.objectResults || [],
    );

    return {
      messages: state.messages || [],
      originalMessage: subgraphMessage,
      chatSessionId: state.chatSessionId,
      intent: currentIntent,
      // Pass the created objects and name mapping from coordinator state
      createdObjects,
      objectNameMapping,
      // Always start fresh for other state - let object subgraph rebuild its own state using reset markers
      fieldSpec: RESET_MARKER as never,
      objectSpec: RESET_MARKER as never,
      dbDesignResult: RESET_MARKER as never,
      typeMappingResult: RESET_MARKER as never,
      // Only inherit executionResult for same-intent retries, never cross-intent
      executionResult: RESET_MARKER as never,
      currentNode: 'start',
      retryCount: RESET_MARKER as never,
      isCompleted: RESET_MARKER as never,
    };
  }

  /**
   * Transform objectResults from coordinator state to object graph state format
   */
  private transformObjectResults(objectResults: ObjectIntentResult[]): {
    createdObjects: CreatedObjectInfo[];
    objectNameMapping: ObjectNameMapping;
  } {
    const createdObjects: CreatedObjectInfo[] = [];
    const objectNameMapping: ObjectNameMapping = {};

    for (const result of objectResults) {
      if (result.status === 'success' || result.status === 'partial') {
        const executionResult = result.result?.executionResult;

        if (executionResult && executionResult.createdEntities?.object) {
          // Extract the unique object name (which is the primary key in NFlow)
          const uniqueName = executionResult.createdEntities.object;

          // Get the display name from the enhanced execution result
          const displayName =
            executionResult.createdEntities.objectDisplayName ||
            result.result?.objectName ||
            this.extractOriginalNameFromSummary(result.result?.summary) ||
            uniqueName;

          // Get description from execution result or use summary
          const description =
            executionResult.createdEntities.objectDescription ||
            `Object created in intent ${result.intentIndex}`;

          // Extract original name from the name mapping if available
          let originalName = displayName;
          if (executionResult.createdEntities.objectNameMapping) {
            const mapping = executionResult.createdEntities.objectNameMapping;
            // Find the original name that maps to this unique name
            const originalKey = Object.keys(mapping).find((key) => mapping[key] === uniqueName);
            if (originalKey) {
              originalName = originalKey;
            }
          }

          // Create object info
          const objectInfo: CreatedObjectInfo = {
            originalName,
            uniqueName,
            displayName,
            description,
            createdAt: result.timestamp,
            intentIndex: result.intentIndex,
            fields: this.extractFieldsFromExecutionResult(executionResult),
          };

          createdObjects.push(objectInfo);
          objectNameMapping[displayName] = uniqueName;

          // Also add mapping for original name if different
          if (originalName !== displayName) {
            objectNameMapping[originalName] = uniqueName;
          }
        }
      }
    }

    return { createdObjects, objectNameMapping };
  }

  /**
   * Extract original display name from result summary
   */
  private extractOriginalNameFromSummary(summary?: string): string | null {
    if (!summary) return null;

    // Try to extract object name from summary patterns like "Create object: ObjectName"
    const createMatch = summary.match(/(?:Create|create)\s+(?:object|Object):\s*([^-\s]+)/);
    if (createMatch) {
      return createMatch[1].trim();
    }

    return null;
  }

  /**
   * Extract field information from execution result
   */
  private extractFieldsFromExecutionResult(executionResult: ObjectExecutionResult): Array<{
    name: string;
    typeName: string;
    displayName: string;
  }> {
    const fields: Array<{ name: string; typeName: string; displayName: string }> = [];

    // If we have field information in createdEntities
    const createdEntities = executionResult.createdEntities;
    if (createdEntities && createdEntities.fields && Array.isArray(createdEntities.fields)) {
      for (const fieldName of createdEntities.fields) {
        if (typeof fieldName === 'string') {
          fields.push({
            name: fieldName,
            typeName: 'unknown', // Type information might not be available in execution result
            displayName: fieldName,
          });
        }
      }
    }

    return fields;
  }

  transformToCoordinatorState(
    subgraphOutput: ObjectStateType,
    coordinatorState: CoordinatorStateType,
  ): Partial<CoordinatorStateType> {
    const processedIntents = [
      ...coordinatorState.processedIntents,
      coordinatorState.currentIntentIndex,
    ];
    const nextIntentIndex = coordinatorState.currentIntentIndex + 1;

    // Determine completion status based on execution result
    const isObjectCompleted = subgraphOutput.executionResult?.status === 'success';
    const hasPartialSuccess = subgraphOutput.executionResult?.status === 'partial';
    const hasFailed = subgraphOutput.executionResult?.status === 'failed';
    const hasAnySuccess = isObjectCompleted || hasPartialSuccess;

    // Create intent error if there was a failure (but not for partial successes)
    const currentIntent =
      coordinatorState.classifiedIntent?.intents[coordinatorState.currentIntentIndex];
    const newIntentErrors: IntentError[] = [];

    // Only create intent errors for complete failures or when there's an explicit error
    if ((hasFailed && !hasPartialSuccess) || subgraphOutput.error) {
      if (currentIntent && currentIntent.id) {
        const existingErrorsForIntent = coordinatorState.errors.filter(
          (err) => err.intentId === currentIntent.id,
        );
        const retryCount = existingErrorsForIntent.length;

        const errorMessage =
          subgraphOutput.error ||
          (subgraphOutput.executionResult?.errors
            ? subgraphOutput.executionResult.errors.join(', ')
            : 'Object execution failed');

        newIntentErrors.push({
          intentId: currentIntent.id,
          errorMessage,
          timestamp: new Date().toISOString(),
          retryCount,
        });
      }
    }

    // Create object result for this intent - simplified to high-level data only
    const executionResult = subgraphOutput.executionResult;
    const objectResult: ObjectIntentResult = {
      intentId: `intent_${coordinatorState.currentIntentIndex}`,
      intentIndex: coordinatorState.currentIntentIndex,
      timestamp: new Date().toISOString(),
      domain: 'object',
      status: isObjectCompleted
        ? 'success'
        : hasPartialSuccess
          ? 'partial'
          : hasFailed
            ? 'failed'
            : 'failed',
      result: {
        objectName: executionResult?.createdEntities?.object,
        summary: this.formatResponseMessage(subgraphOutput),
        entitiesCreated: {
          objectCount: executionResult?.objectId ? 1 : 0,
          fieldCount: executionResult?.fieldIds?.length || 0,
        },
        // Keep execution result for summarization
        executionResult: executionResult || undefined,
      },
    };

    // Update or add the object result for this specific intent
    const existingObjectResults = coordinatorState.objectResults || [];
    const existingResultIndex = existingObjectResults.findIndex(
      (result) => result.intentIndex === coordinatorState.currentIntentIndex,
    );

    let updatedObjectResults: ObjectIntentResult[];
    if (existingResultIndex >= 0) {
      // Replace existing result for this intent (e.g., on retry)
      updatedObjectResults = [...existingObjectResults];
      updatedObjectResults[existingResultIndex] = objectResult;
    } else {
      // Add new result for this intent
      updatedObjectResults = [...existingObjectResults, objectResult];
    }

    // Extract only NEW messages from subgraph to prevent duplication
    const coordinatorMessageIds = coordinatorState.messages.map((message) => message.id);
    const newMessages = subgraphOutput.messages.filter(
      (message) => !coordinatorMessageIds.includes(message.id),
    );

    // Always return the state update with incremented intent index
    const coordinatorUpdate: Partial<CoordinatorStateType> = {
      messages: [...coordinatorState.messages, ...newMessages],
      isCompleted: hasAnySuccess,
      processedIntents,
      currentIntentIndex: nextIntentIndex,
      errors: [...coordinatorState.errors, ...newIntentErrors],
      objectResults: updatedObjectResults,
    };

    // Note: We always increment the intent index, even on failure
    // This prevents infinite loops and allows processing of remaining intents
    return coordinatorUpdate;
  }

  formatResponseMessage(subgraphOutput: ObjectStateType): string {
    const message = subgraphOutput.originalMessage || '';
    const executionResult = subgraphOutput.executionResult;

    if (executionResult) {
      let status: string;
      let resultMessage: string;

      switch (executionResult.status) {
        case 'success':
          status = 'succeeded';
          resultMessage = 'succeeded';
          break;
        case 'partial':
          status = 'partially succeeded';
          resultMessage = `partially succeeded${executionResult.errors ? ` with errors: ${executionResult.errors.join(', ')}` : ''}`;
          break;
        case 'failed':
        default:
          status = 'failed';
          resultMessage = `failed${executionResult.errors ? ` with error: ${executionResult.errors.join(', ')}` : ''}`;
          break;
      }

      return `${message} - Execution ${status}: ${resultMessage}`;
    }

    return message;
  }
}
