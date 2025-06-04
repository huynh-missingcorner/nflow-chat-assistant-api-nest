import { Injectable } from '@nestjs/common';

import {
  BaseGraphHandlerService,
  GraphHandlerConfig,
  GraphStateBase,
} from '../handlers/base-graph-handler.service';
import { BaseGraphNode } from './base-graph-node';

@Injectable()
export class GenericHandleSuccessNode<TState extends GraphStateBase> extends BaseGraphNode<TState> {
  constructor(
    private readonly handlerService: BaseGraphHandlerService<TState>,
    private readonly config: GraphHandlerConfig,
    private readonly nodeName: string,
    private readonly additionalData: Partial<TState> = {} as Partial<TState>,
  ) {
    super();
  }

  execute(state: TState): Partial<TState> {
    const result = this.handlerService.handleSuccess(state, this.config, this.additionalData);
    return this.createSuccessResult(result);
  }

  protected getNodeName(): string {
    return this.nodeName;
  }
}
