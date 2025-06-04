import { Module } from '@nestjs/common';

import { ApplicationAgentModule } from '@/modules/agents-v2/application/application-agent.module';
import { ObjectModule } from '@/modules/agents-v2/object/object.module';
import { loadFileContent } from '@/shared/utils';

import { CoordinatorGraphBuilder } from './builders/coordinator-graph.builder';
import { COORDINATOR_SYSTEM_PROMPT } from './constants/tokens';
import { CoordinatorAgentService } from './coordinator-agent.service';
import { CoordinatorHandlerNodeFactory } from './factories/handler-node.factory';
import { NodeFactory } from './factories/node.factory';
import { ClassifyIntentNode } from './nodes/classify-intent.node';
import { HandleErrorNode } from './nodes/handle-error.node';
import { HandleRetryNode } from './nodes/handle-retry.node';
import { HandleSuccessNode } from './nodes/handle-success.node';
import { ProcessNextIntentNode } from './nodes/process-next-intent.node';
import { ValidateClassificationNode } from './nodes/validate-classification.node';
import { ApplicationSubgraphHandler } from './services/handlers';
import { ObjectSubgraphHandler } from './services/handlers/object-subgraph.handler';
import { SubgraphWrapperService } from './services/subgraph-wrapper.service';
import { EdgeRoutingStrategy } from './strategies/edge-routing.strategy';
import { IntentCombinationValidator } from './validators/intent-combination.validator';

@Module({
  imports: [ApplicationAgentModule, ObjectModule],
  providers: [
    // Core components
    IntentCombinationValidator,
    EdgeRoutingStrategy,
    NodeFactory,
    SubgraphWrapperService,

    // Factories
    CoordinatorHandlerNodeFactory,

    // System prompt provider
    {
      provide: COORDINATOR_SYSTEM_PROMPT,
      useFactory: () => {
        return loadFileContent(
          'src/modules/agents-v2/coordinator/context/coordinator-agent-system-prompt.md',
        );
      },
    },

    // Nodes
    ClassifyIntentNode,
    ValidateClassificationNode,
    ProcessNextIntentNode,
    HandleSuccessNode,
    HandleErrorNode,
    HandleRetryNode,

    // Main services
    CoordinatorGraphBuilder,
    CoordinatorAgentService,

    // Subgraph handlers
    ApplicationSubgraphHandler,
    ObjectSubgraphHandler,
  ],
  exports: [CoordinatorAgentService],
})
export class CoordinatorAgentModule {}
