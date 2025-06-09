import { Module } from '@nestjs/common';

import { ChatSessionModule } from '@/modules/chat-session/chat-session.module';
import { NFlowModule } from '@/modules/nflow/nflow.module';
import { BaseGraphHandlerService } from '@/shared/graph/handlers/base-graph-handler.service';

import { ObjectGraphBuilder } from './builders/object-graph.builder';
import { ObjectHandlerNodeFactory } from './factories/handler-node.factory';
import { DBDesignNode } from './nodes/db-design.node';
import { FieldUnderstandingNode } from './nodes/field-understanding.node';
import { HandleErrorNode } from './nodes/handle-error.node';
import { HandleRetryNode } from './nodes/handle-retry.node';
import { HandleSuccessNode } from './nodes/handle-success.node';
import { ObjectExecutorNode } from './nodes/object-executor.node';
import { ObjectUnderstandingNode } from './nodes/object-understanding.node';
import { SchemaExecutorNode } from './nodes/schema-executor.node';
import { SchemaUnderstandingNode } from './nodes/schema-understanding.node';
import { TypeMapperNode } from './nodes/type-mapper.node';
import { ObjectAgentService } from './object-agent.service';
import { ObjectGraphEdgeRoutingStrategy } from './strategies/object-graph-edge-routing.strategy';

@Module({
  imports: [ChatSessionModule, NFlowModule],
  providers: [
    // Main service
    ObjectAgentService,

    // Graph builder
    ObjectGraphBuilder,

    // Edge routing strategy
    ObjectGraphEdgeRoutingStrategy,

    // Shared services
    BaseGraphHandlerService,

    // Factories
    ObjectHandlerNodeFactory,

    // Nodes
    FieldUnderstandingNode,
    ObjectUnderstandingNode,
    SchemaUnderstandingNode,
    DBDesignNode,
    TypeMapperNode,
    ObjectExecutorNode,
    SchemaExecutorNode,
    HandleSuccessNode,
    HandleErrorNode,
    HandleRetryNode,
  ],
  exports: [ObjectAgentService, ObjectGraphBuilder],
})
export class ObjectModule {}
