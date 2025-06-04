import { Injectable } from '@nestjs/common';

import { APPLICATION_GRAPH_NODES } from '../constants/application-graph.constants';
import { ApplicationHandlerNodeFactory } from '../factories/handler-node.factory';
import { ApplicationStateType } from '../types/application-graph-state.types';
import { ApplicationGraphNodeBase } from './application-graph-node.base';

@Injectable()
export class HandleRetryNode extends ApplicationGraphNodeBase {
  constructor(private readonly handlerFactory: ApplicationHandlerNodeFactory) {
    super();
  }

  protected getNodeName(): string {
    return APPLICATION_GRAPH_NODES.HANDLE_RETRY;
  }

  execute(state: ApplicationStateType): Partial<ApplicationStateType> {
    const retryNode = this.handlerFactory.createRetryNode();
    return retryNode.execute(state);
  }
}
