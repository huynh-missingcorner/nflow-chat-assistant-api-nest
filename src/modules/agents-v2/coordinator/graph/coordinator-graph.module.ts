import { Module } from '@nestjs/common';
import { MemorySaver } from '@langchain/langgraph';

import { loadFileContent } from '@/shared/utils';

import { GraphBuilder } from './builders/graph.builder';
import { COORDINATOR_SYSTEM_PROMPT } from './constants/tokens';
import { CoordinatorGraphService } from './coordinator-graph.service';
import { NodeFactory } from './factories/node.factory';
import { ClassifyIntentNode } from './nodes/classify-intent.node';
import { HandleErrorNode } from './nodes/handle-error.node';
import { HandleRetryNode } from './nodes/handle-retry.node';
import { HandleSuccessNode } from './nodes/handle-success.node';
import { ProcessNextIntentNode } from './nodes/process-next-intent.node';
import { ValidateClassificationNode } from './nodes/validate-classification.node';
import { EdgeRoutingStrategy } from './strategies/edge-routing.strategy';
import { IntentCombinationValidator } from './validators/intent-combination.validator';

@Module({
  providers: [
    // Core components
    MemorySaver,
    IntentCombinationValidator,
    EdgeRoutingStrategy,
    NodeFactory,

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
    GraphBuilder,
    CoordinatorGraphService,
  ],
  exports: [CoordinatorGraphService],
})
export class CoordinatorGraphModule {}
