import { Module } from '@nestjs/common';

import { ApplicationAgentService } from './application-agent.service';
import { ApplicationGraphBuilder } from './builders/application-graph.builder';
import { ApplicationHandlerNodeFactory } from './factories/handler-node.factory';
import { AppDesignNode } from './nodes/app-design.node';
import { AppExecutorNode } from './nodes/app-executor.node';
import { AppUnderstandingNode } from './nodes/app-understanding.node';
import { HandleErrorNode } from './nodes/handle-error.node';
import { HandleRetryNode } from './nodes/handle-retry.node';
import { HandleSuccessNode } from './nodes/handle-success.node';
import { ApplicationGraphEdgeRoutingStrategy } from './strategies/application-graph-edge-routing.strategy';

@Module({
  imports: [],
  providers: [
    ApplicationAgentService,

    // Graph Builder
    ApplicationGraphBuilder,

    // Factories
    ApplicationHandlerNodeFactory,

    // Graph Nodes
    AppUnderstandingNode,
    AppDesignNode,
    AppExecutorNode,
    HandleSuccessNode,
    HandleErrorNode,
    HandleRetryNode,

    // Strategies
    ApplicationGraphEdgeRoutingStrategy,
  ],
  exports: [ApplicationAgentService, ApplicationGraphBuilder],
})
export class ApplicationAgentModule {}
