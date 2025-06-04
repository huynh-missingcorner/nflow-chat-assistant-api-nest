import { Injectable } from '@nestjs/common';

import { GRAPH_NODES } from '../constants/graph-constants';
import { CoordinatorHandlerNodeFactory } from '../factories/handler-node.factory';
import { CoordinatorStateType } from '../types/graph-state.types';
import { GraphNodeBase } from './graph-node.base';

@Injectable()
export class HandleSuccessNode extends GraphNodeBase {
  constructor(private readonly handlerFactory: CoordinatorHandlerNodeFactory) {
    super();
  }

  execute(state: CoordinatorStateType): Partial<CoordinatorStateType> {
    const successNode = this.handlerFactory.createSuccessNode();
    return successNode.execute(state);
  }

  protected getNodeName(): string {
    return GRAPH_NODES.HANDLE_SUCCESS;
  }
}
