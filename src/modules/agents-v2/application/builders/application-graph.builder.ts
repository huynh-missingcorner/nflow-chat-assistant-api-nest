import { Injectable } from '@nestjs/common';
import { END, MemorySaver, START, StateGraph } from '@langchain/langgraph';

import {
  APPLICATION_GRAPH_EDGES,
  APPLICATION_GRAPH_NODES,
} from '../constants/application-graph.constants';
import { AppDesignNode } from '../nodes/app-design.node';
import { AppExecutorNode } from '../nodes/app-executor.node';
import { AppUnderstandingNode } from '../nodes/app-understanding.node';
import { HandleErrorNode } from '../nodes/handle-error.node';
import { HandleRetryNode } from '../nodes/handle-retry.node';
import { HandleSuccessNode } from '../nodes/handle-success.node';
import { ApplicationGraphEdgeRoutingStrategy } from '../strategies/application-graph-edge-routing.strategy';
import { ApplicationState } from '../types/application-graph-state.types';

export interface IApplicationGraphBuilder {
  buildGraph(): ReturnType<typeof StateGraph.prototype.compile>;
}

@Injectable()
export class ApplicationGraphBuilder implements IApplicationGraphBuilder {
  constructor(
    private readonly appUnderstandingNode: AppUnderstandingNode,
    private readonly appDesignNode: AppDesignNode,
    private readonly appExecutorNode: AppExecutorNode,
    private readonly handleSuccessNode: HandleSuccessNode,
    private readonly handleErrorNode: HandleErrorNode,
    private readonly handleRetryNode: HandleRetryNode,
    private readonly edgeRoutingStrategy: ApplicationGraphEdgeRoutingStrategy,
    private readonly checkpointer: MemorySaver,
  ) {}

  buildGraph(): ReturnType<typeof StateGraph.prototype.compile> {
    const workflow = new StateGraph(ApplicationState)
      .addNode(
        APPLICATION_GRAPH_NODES.APP_UNDERSTANDING,
        this.appUnderstandingNode.execute.bind(this.appUnderstandingNode),
      )
      .addNode(
        APPLICATION_GRAPH_NODES.APP_DESIGN,
        this.appDesignNode.execute.bind(this.appDesignNode),
      )
      .addNode(
        APPLICATION_GRAPH_NODES.APP_EXECUTOR,
        this.appExecutorNode.execute.bind(this.appExecutorNode),
      )
      .addNode(
        APPLICATION_GRAPH_NODES.HANDLE_SUCCESS,
        this.handleSuccessNode.execute.bind(this.handleSuccessNode),
      )
      .addNode(
        APPLICATION_GRAPH_NODES.HANDLE_ERROR,
        this.handleErrorNode.execute.bind(this.handleErrorNode),
      )
      .addNode(
        APPLICATION_GRAPH_NODES.HANDLE_RETRY,
        this.handleRetryNode.execute.bind(this.handleRetryNode),
      );

    // Define the workflow edges
    workflow.addEdge(START, APPLICATION_GRAPH_NODES.APP_UNDERSTANDING);

    // After understanding, go to design or handle error
    workflow.addConditionalEdges(
      APPLICATION_GRAPH_NODES.APP_UNDERSTANDING,
      this.edgeRoutingStrategy.determineAfterUnderstandingRoute.bind(this.edgeRoutingStrategy),
      {
        [APPLICATION_GRAPH_EDGES.DESIGN]: APPLICATION_GRAPH_NODES.APP_DESIGN,
        [APPLICATION_GRAPH_EDGES.ERROR]: APPLICATION_GRAPH_NODES.HANDLE_ERROR,
        [APPLICATION_GRAPH_EDGES.RETRY]: APPLICATION_GRAPH_NODES.HANDLE_RETRY,
      },
    );

    // After design, go to execution or handle error
    workflow.addConditionalEdges(
      APPLICATION_GRAPH_NODES.APP_DESIGN,
      this.edgeRoutingStrategy.determineAfterDesignRoute.bind(this.edgeRoutingStrategy),
      {
        [APPLICATION_GRAPH_EDGES.EXECUTE]: APPLICATION_GRAPH_NODES.APP_EXECUTOR,
        [APPLICATION_GRAPH_EDGES.ERROR]: APPLICATION_GRAPH_NODES.HANDLE_ERROR,
        [APPLICATION_GRAPH_EDGES.RETRY]: APPLICATION_GRAPH_NODES.HANDLE_RETRY,
      },
    );

    // After execution, go to success or handle error
    workflow.addConditionalEdges(
      APPLICATION_GRAPH_NODES.APP_EXECUTOR,
      this.edgeRoutingStrategy.determineAfterExecutionRoute.bind(this.edgeRoutingStrategy),
      {
        [APPLICATION_GRAPH_EDGES.SUCCESS]: APPLICATION_GRAPH_NODES.HANDLE_SUCCESS,
        [APPLICATION_GRAPH_EDGES.ERROR]: APPLICATION_GRAPH_NODES.HANDLE_ERROR,
        [APPLICATION_GRAPH_EDGES.RETRY]: APPLICATION_GRAPH_NODES.HANDLE_RETRY,
      },
    );

    // Retry node goes back to understanding
    workflow.addConditionalEdges(
      APPLICATION_GRAPH_NODES.HANDLE_RETRY,
      this.edgeRoutingStrategy.determineRetryRoute.bind(this.edgeRoutingStrategy),
      {
        [APPLICATION_GRAPH_EDGES.RETRY]: APPLICATION_GRAPH_NODES.APP_UNDERSTANDING,
        [APPLICATION_GRAPH_EDGES.ERROR]: APPLICATION_GRAPH_NODES.HANDLE_ERROR,
      },
    );

    // Success and error nodes end the workflow
    workflow.addEdge(APPLICATION_GRAPH_NODES.HANDLE_SUCCESS, END);
    workflow.addEdge(APPLICATION_GRAPH_NODES.HANDLE_ERROR, END);

    return workflow.compile({
      checkpointer: this.checkpointer,
    });
  }
}
