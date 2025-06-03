import { Injectable } from '@nestjs/common';

import { APPLICATION_GRAPH_NODES } from '../constants/application-graph.constants';
import { ApplicationStateType } from '../types/application-graph-state.types';
import { ApplicationGraphNodeBase } from './application-graph-node.base';

@Injectable()
export class HandleErrorNode extends ApplicationGraphNodeBase {
  protected getNodeName(): string {
    return APPLICATION_GRAPH_NODES.HANDLE_ERROR;
  }

  execute(state: ApplicationStateType): Partial<ApplicationStateType> {
    this.logger.error('Application graph execution failed', state.error);

    return this.createSuccessResult({
      isCompleted: true,
    });
  }
}
