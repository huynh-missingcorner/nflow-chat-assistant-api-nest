import { Injectable } from '@nestjs/common';

import { GRAPH_NODES, LOG_MESSAGES } from '../constants/graph-constants';
import { CoordinatorStateType } from '../types/graph-state.types';
import { GraphNodeBase } from './graph-node.base';

@Injectable()
export class HandleErrorNode extends GraphNodeBase {
  execute(state: CoordinatorStateType): Partial<CoordinatorStateType> {
    this.logger.error(LOG_MESSAGES.WORKFLOW_FAILED(state.error || 'Unknown error'));

    return this.createSuccessResult({});
  }

  protected getNodeName(): string {
    return GRAPH_NODES.HANDLE_ERROR;
  }
}
