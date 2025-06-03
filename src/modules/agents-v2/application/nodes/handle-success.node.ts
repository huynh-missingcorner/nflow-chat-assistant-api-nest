import { Injectable } from '@nestjs/common';

import { APPLICATION_GRAPH_NODES } from '../constants/application-graph.constants';
import { ApplicationStateType } from '../types/application-graph-state.types';
import { ApplicationGraphNodeBase } from './application-graph-node.base';

@Injectable()
export class HandleSuccessNode extends ApplicationGraphNodeBase {
  protected getNodeName(): string {
    return APPLICATION_GRAPH_NODES.HANDLE_SUCCESS;
  }

  execute(state: ApplicationStateType): Partial<ApplicationStateType> {
    this.logger.log('Application graph completed successfully', state);

    return this.createSuccessResult({
      isCompleted: true,
      error: null,
    });
  }
}
