import { Injectable } from '@nestjs/common';
import { END, START, StateGraph } from '@langchain/langgraph';

import { PersistenceService } from '@/shared/infrastructure/persistence';

import { GRAPH_EDGES, GRAPH_NODES } from '../constants/graph-constants';
import { ClassifyIntentNode } from '../nodes/classify-intent.node';
import { HandleErrorNode } from '../nodes/handle-error.node';
import { HandleRetryNode } from '../nodes/handle-retry.node';
import { HandleSuccessNode } from '../nodes/handle-success.node';
import { ProcessNextIntentNode } from '../nodes/process-next-intent.node';
import { ValidateClassificationNode } from '../nodes/validate-classification.node';
import { SubgraphWrapperService } from '../services/subgraph-wrapper.service';
import { EdgeRoutingStrategy } from '../strategies/edge-routing.strategy';
import { CoordinatorState } from '../types/graph-state.types';

export interface IGraphBuilder {
  buildGraph(): ReturnType<typeof StateGraph.prototype.compile>;
}

@Injectable()
export class CoordinatorGraphBuilder implements IGraphBuilder {
  constructor(
    private readonly classifyIntentNode: ClassifyIntentNode,
    private readonly validateClassificationNode: ValidateClassificationNode,
    private readonly processNextIntentNode: ProcessNextIntentNode,
    private readonly handleSuccessNode: HandleSuccessNode,
    private readonly handleErrorNode: HandleErrorNode,
    private readonly handleRetryNode: HandleRetryNode,
    private readonly edgeRoutingStrategy: EdgeRoutingStrategy,
    private readonly persistenceService: PersistenceService,
    private readonly subgraphWrapperService: SubgraphWrapperService,
  ) {}

  buildGraph(): ReturnType<typeof StateGraph.prototype.compile> {
    const workflow = new StateGraph(CoordinatorState)
      .addNode(
        GRAPH_NODES.CLASSIFY_INTENT,
        this.classifyIntentNode.execute.bind(this.classifyIntentNode),
      )
      .addNode(
        GRAPH_NODES.VALIDATE_CLASSIFICATION,
        this.validateClassificationNode.execute.bind(this.validateClassificationNode),
      )
      .addNode(
        GRAPH_NODES.PROCESS_NEXT_INTENT,
        this.processNextIntentNode.execute.bind(this.processNextIntentNode),
      )
      .addNode(
        GRAPH_NODES.APPLICATION_SUBGRAPH,
        this.subgraphWrapperService.createSubgraphWrapper('application'),
      )
      .addNode(
        GRAPH_NODES.HANDLE_SUCCESS,
        this.handleSuccessNode.execute.bind(this.handleSuccessNode),
      )
      .addNode(GRAPH_NODES.HANDLE_ERROR, this.handleErrorNode.execute.bind(this.handleErrorNode))
      .addNode(GRAPH_NODES.HANDLE_RETRY, this.handleRetryNode.execute.bind(this.handleRetryNode));

    workflow.addEdge(START, GRAPH_NODES.CLASSIFY_INTENT);

    workflow.addConditionalEdges(
      GRAPH_NODES.CLASSIFY_INTENT,
      this.edgeRoutingStrategy.determineValidationRoute.bind(this.edgeRoutingStrategy),
      {
        [GRAPH_EDGES.VALIDATE]: GRAPH_NODES.VALIDATE_CLASSIFICATION,
        [GRAPH_EDGES.ERROR]: GRAPH_NODES.HANDLE_ERROR,
      },
    );

    // After validation, either process the next intent or handle error
    workflow.addConditionalEdges(
      GRAPH_NODES.VALIDATE_CLASSIFICATION,
      this.edgeRoutingStrategy.determineNextIntentOrErrorRoute.bind(this.edgeRoutingStrategy),
      {
        [GRAPH_EDGES.NEXT_INTENT]: GRAPH_NODES.PROCESS_NEXT_INTENT,
        [GRAPH_EDGES.RETRY]: GRAPH_NODES.HANDLE_RETRY,
        [GRAPH_EDGES.ERROR]: GRAPH_NODES.HANDLE_ERROR,
      },
    );

    // After processing an intent, route to appropriate subgraph or continue
    workflow.addConditionalEdges(
      GRAPH_NODES.PROCESS_NEXT_INTENT,
      this.edgeRoutingStrategy.determineIntentRoutingOrSuccessRoute.bind(this.edgeRoutingStrategy),
      {
        [GRAPH_EDGES.NEXT_INTENT]: GRAPH_NODES.PROCESS_NEXT_INTENT,
        [GRAPH_EDGES.SUCCESS]: GRAPH_NODES.HANDLE_SUCCESS,
        [GRAPH_EDGES.ERROR]: GRAPH_NODES.HANDLE_ERROR,
        [GRAPH_EDGES.APPLICATION_DOMAIN]: GRAPH_NODES.APPLICATION_SUBGRAPH,
      },
    );

    // After application subgraph execution, return to process next intent or success
    workflow.addConditionalEdges(
      GRAPH_NODES.APPLICATION_SUBGRAPH,
      this.edgeRoutingStrategy.determineAfterSubgraphRoute.bind(this.edgeRoutingStrategy),
      {
        [GRAPH_EDGES.NEXT_INTENT]: GRAPH_NODES.PROCESS_NEXT_INTENT,
        [GRAPH_EDGES.SUCCESS]: GRAPH_NODES.HANDLE_SUCCESS,
        [GRAPH_EDGES.ERROR]: GRAPH_NODES.HANDLE_ERROR,
      },
    );

    // Retry node goes back to classification
    workflow.addEdge(GRAPH_NODES.HANDLE_RETRY, GRAPH_NODES.CLASSIFY_INTENT);

    // Success and error nodes end the workflow
    workflow.addEdge(GRAPH_NODES.HANDLE_SUCCESS, END);
    workflow.addEdge(GRAPH_NODES.HANDLE_ERROR, END);

    return workflow.compile({
      checkpointer: this.persistenceService.getCheckpointer(),
    });
  }
}
