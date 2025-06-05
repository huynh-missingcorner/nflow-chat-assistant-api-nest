import { Injectable } from '@nestjs/common';

import { OBJECT_GRAPH_NODES } from '../constants/object-graph.constants';
import { ObjectHandlerNodeFactory } from '../factories/handler-node.factory';
import { ObjectStateType } from '../types/object-graph-state.types';
import { ObjectGraphNodeBase } from './object-graph-node.base';

@Injectable()
export class HandleErrorNode extends ObjectGraphNodeBase {
  constructor(private readonly handlerFactory: ObjectHandlerNodeFactory) {
    super();
  }

  protected getNodeName(): string {
    return OBJECT_GRAPH_NODES.HANDLE_ERROR;
  }

  execute(state: ObjectStateType): Partial<ObjectStateType> {
    const errorNode = this.handlerFactory.createErrorNode();
    return errorNode.execute(state);
  }
}
