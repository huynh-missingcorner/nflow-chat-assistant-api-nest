import { Injectable, Logger } from '@nestjs/common';
import { SystemMessage } from '@langchain/core/messages';

import { OBJECT_LOG_MESSAGES } from '../constants/object-graph.constants';
import { ObjectStateType } from '../types/object-graph-state.types';

@Injectable()
export class HandleErrorNode {
  private readonly logger = new Logger(HandleErrorNode.name);

  execute(state: ObjectStateType): Partial<ObjectStateType> {
    const errorMessage = state.error || 'An unknown error occurred during object processing';

    this.logger.error(OBJECT_LOG_MESSAGES.WORKFLOW_FAILED(errorMessage));

    return {
      isCompleted: true,
      messages: [...state.messages, new SystemMessage(`Object workflow failed: ${errorMessage}`)],
    };
  }
}
