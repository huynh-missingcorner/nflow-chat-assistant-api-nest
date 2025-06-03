import { Injectable } from '@nestjs/common';
import { END, MemorySaver, START, StateGraph } from '@langchain/langgraph';

import { ApplicationGraphBuilder } from '@/modules/agents-v2/application/builders/application-graph.builder';

import { GRAPH_EDGES, GRAPH_NODES } from '../constants/graph-constants';
import { ClassifyIntentNode } from '../nodes/classify-intent.node';
import { HandleErrorNode } from '../nodes/handle-error.node';
import { HandleRetryNode } from '../nodes/handle-retry.node';
import { HandleSuccessNode } from '../nodes/handle-success.node';
import { PostApplicationSubgraphNode } from '../nodes/post-application-subgraph.node';
import { PrepareApplicationSubgraphNode } from '../nodes/prepare-application-subgraph.node';
import { ProcessNextIntentNode } from '../nodes/process-next-intent.node';
import { ValidateClassificationNode } from '../nodes/validate-classification.node';
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
    private readonly prepareApplicationSubgraphNode: PrepareApplicationSubgraphNode,
    private readonly postApplicationSubgraphNode: PostApplicationSubgraphNode,
    private readonly handleSuccessNode: HandleSuccessNode,
    private readonly handleErrorNode: HandleErrorNode,
    private readonly handleRetryNode: HandleRetryNode,
    private readonly edgeRoutingStrategy: EdgeRoutingStrategy,
    private readonly checkpointer: MemorySaver,
    private readonly applicationGraphBuilder: ApplicationGraphBuilder,
  ) {}

  buildGraph(): ReturnType<typeof StateGraph.prototype.compile> {
    const applicationSubgraph = this.applicationGraphBuilder.buildGraph();

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
        GRAPH_NODES.PREPARE_APPLICATION_SUBGRAPH,
        this.prepareApplicationSubgraphNode.execute.bind(this.prepareApplicationSubgraphNode),
      )
      .addNode(GRAPH_NODES.APPLICATION_SUBGRAPH, applicationSubgraph)
      .addNode(
        GRAPH_NODES.POST_APPLICATION_SUBGRAPH,
        this.postApplicationSubgraphNode.execute.bind(this.postApplicationSubgraphNode),
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
        [GRAPH_EDGES.APPLICATION_DOMAIN]: GRAPH_NODES.PREPARE_APPLICATION_SUBGRAPH,
      },
    );

    // Application domain workflow: Prepare -> Execute -> Post-process
    workflow.addEdge(GRAPH_NODES.PREPARE_APPLICATION_SUBGRAPH, GRAPH_NODES.APPLICATION_SUBGRAPH);
    workflow.addEdge(GRAPH_NODES.APPLICATION_SUBGRAPH, GRAPH_NODES.POST_APPLICATION_SUBGRAPH);

    // After post-processing, return to process next intent or success
    workflow.addConditionalEdges(
      GRAPH_NODES.POST_APPLICATION_SUBGRAPH,
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
      checkpointer: this.checkpointer,
    });
  }
}
