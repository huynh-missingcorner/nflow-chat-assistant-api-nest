import { Injectable } from '@nestjs/common';

import { GRAPH_NODES, LOG_MESSAGES } from '../constants/graph-constants';
import { CoordinatorStateType } from '../types/graph-state.types';
import { GraphNodeBase } from './graph-node.base';

@Injectable()
export class HandleSuccessNode extends GraphNodeBase {
  execute(): Partial<CoordinatorStateType> {
    this.logger.log(LOG_MESSAGES.WORKFLOW_COMPLETED);

    return this.createSuccessResult({});
  }

  protected getNodeName(): string {
    return GRAPH_NODES.HANDLE_SUCCESS;
  }
}
