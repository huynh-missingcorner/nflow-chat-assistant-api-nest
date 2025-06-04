import { Injectable, Logger } from '@nestjs/common';
import { SystemMessage } from '@langchain/core/messages';

import { OBJECT_LOG_MESSAGES } from '../constants/object-graph.constants';
import { ObjectStateType } from '../types/object-graph-state.types';

@Injectable()
export class HandleSuccessNode {
  private readonly logger = new Logger(HandleSuccessNode.name);

  execute(state: ObjectStateType): Partial<ObjectStateType> {
    this.logger.log(OBJECT_LOG_MESSAGES.WORKFLOW_COMPLETED);

    const successMessage = this.buildSuccessMessage(state);

    return {
      isCompleted: true,
      error: null,
      messages: [...state.messages, new SystemMessage(successMessage)],
    };
  }

  private buildSuccessMessage(state: ObjectStateType): string {
    const results = [];

    if (state.executionResult?.objectId) {
      results.push(`Object created with ID: ${state.executionResult.objectId}`);
    }

    if (state.executionResult?.fieldIds && state.executionResult.fieldIds.length > 0) {
      results.push(`${state.executionResult.fieldIds.length} field(s) added successfully`);
    }

    if (state.objectSpec) {
      results.push(`Object '${state.objectSpec.objectName}' processed successfully`);
    } else if (state.fieldSpec) {
      results.push(`Field '${state.fieldSpec.name}' processed successfully`);
    }

    return results.length > 0
      ? `Object operation completed successfully: ${results.join(', ')}`
      : 'Object operation completed successfully';
  }
}
