import { Injectable } from '@nestjs/common';
import { END, START, StateGraph } from '@langchain/langgraph';

import { OBJECT_GRAPH_EDGES, OBJECT_GRAPH_NODES } from '../constants/object-graph.constants';
import { DBDesignNode } from '../nodes/db-design.node';
import { FieldUnderstandingNode } from '../nodes/field-understanding.node';
import { HandleErrorNode } from '../nodes/handle-error.node';
import { HandleRetryNode } from '../nodes/handle-retry.node';
import { HandleSuccessNode } from '../nodes/handle-success.node';
import { ObjectExecutorNode } from '../nodes/object-executor.node';
import { ObjectUnderstandingNode } from '../nodes/object-understanding.node';
import { TypeMapperNode } from '../nodes/type-mapper.node';
import { ObjectGraphEdgeRoutingStrategy } from '../strategies/object-graph-edge-routing.strategy';
import { ObjectState } from '../types/object-graph-state.types';

export interface IObjectGraphBuilder {
  buildGraph(): ReturnType<typeof StateGraph.prototype.compile>;
}

@Injectable()
export class ObjectGraphBuilder implements IObjectGraphBuilder {
  constructor(
    private readonly fieldUnderstandingNode: FieldUnderstandingNode,
    private readonly objectUnderstandingNode: ObjectUnderstandingNode,
    private readonly dbDesignNode: DBDesignNode,
    private readonly typeMapperNode: TypeMapperNode,
    private readonly objectExecutorNode: ObjectExecutorNode,
    private readonly handleSuccessNode: HandleSuccessNode,
    private readonly handleErrorNode: HandleErrorNode,
    private readonly handleRetryNode: HandleRetryNode,
    private readonly edgeRoutingStrategy: ObjectGraphEdgeRoutingStrategy,
  ) {}

  buildGraph(): ReturnType<typeof StateGraph.prototype.compile> {
    const workflow = new StateGraph(ObjectState)
      .addNode(
        OBJECT_GRAPH_NODES.FIELD_UNDERSTANDING,
        this.fieldUnderstandingNode.execute.bind(this.fieldUnderstandingNode),
      )
      .addNode(
        OBJECT_GRAPH_NODES.OBJECT_UNDERSTANDING,
        this.objectUnderstandingNode.execute.bind(this.objectUnderstandingNode),
      )
      .addNode(OBJECT_GRAPH_NODES.DB_DESIGN, this.dbDesignNode.execute.bind(this.dbDesignNode))
      .addNode(
        OBJECT_GRAPH_NODES.TYPE_MAPPER,
        this.typeMapperNode.execute.bind(this.typeMapperNode),
      )
      .addNode(
        OBJECT_GRAPH_NODES.OBJECT_EXECUTOR,
        this.objectExecutorNode.execute.bind(this.objectExecutorNode),
      )
      .addNode(
        OBJECT_GRAPH_NODES.HANDLE_SUCCESS,
        this.handleSuccessNode.execute.bind(this.handleSuccessNode),
      )
      .addNode(
        OBJECT_GRAPH_NODES.HANDLE_ERROR,
        this.handleErrorNode.execute.bind(this.handleErrorNode),
      )
      .addNode(
        OBJECT_GRAPH_NODES.HANDLE_RETRY,
        this.handleRetryNode.execute.bind(this.handleRetryNode),
      );

    workflow.addConditionalEdges(
      START,
      this.edgeRoutingStrategy.determineInitialRoute.bind(this.edgeRoutingStrategy),
      {
        [OBJECT_GRAPH_EDGES.UNDERSTAND]: OBJECT_GRAPH_NODES.FIELD_UNDERSTANDING,
        [OBJECT_GRAPH_EDGES.DESIGN]: OBJECT_GRAPH_NODES.OBJECT_UNDERSTANDING,
        [OBJECT_GRAPH_EDGES.ERROR]: OBJECT_GRAPH_NODES.HANDLE_ERROR,
      },
    );

    // After field understanding, go to DB design
    workflow.addConditionalEdges(
      OBJECT_GRAPH_NODES.FIELD_UNDERSTANDING,
      this.edgeRoutingStrategy.determineAfterUnderstandingRoute.bind(this.edgeRoutingStrategy),
      {
        [OBJECT_GRAPH_EDGES.DESIGN]: OBJECT_GRAPH_NODES.DB_DESIGN,
        [OBJECT_GRAPH_EDGES.ERROR]: OBJECT_GRAPH_NODES.HANDLE_ERROR,
        [OBJECT_GRAPH_EDGES.RETRY]: OBJECT_GRAPH_NODES.HANDLE_RETRY,
      },
    );

    // After object understanding, go to DB design
    workflow.addConditionalEdges(
      OBJECT_GRAPH_NODES.OBJECT_UNDERSTANDING,
      this.edgeRoutingStrategy.determineAfterUnderstandingRoute.bind(this.edgeRoutingStrategy),
      {
        [OBJECT_GRAPH_EDGES.DESIGN]: OBJECT_GRAPH_NODES.DB_DESIGN,
        [OBJECT_GRAPH_EDGES.ERROR]: OBJECT_GRAPH_NODES.HANDLE_ERROR,
        [OBJECT_GRAPH_EDGES.RETRY]: OBJECT_GRAPH_NODES.HANDLE_RETRY,
      },
    );

    // After DB design, go to type mapping
    workflow.addConditionalEdges(
      OBJECT_GRAPH_NODES.DB_DESIGN,
      this.edgeRoutingStrategy.determineAfterDesignRoute.bind(this.edgeRoutingStrategy),
      {
        [OBJECT_GRAPH_EDGES.MAP_TYPES]: OBJECT_GRAPH_NODES.TYPE_MAPPER,
        [OBJECT_GRAPH_EDGES.ERROR]: OBJECT_GRAPH_NODES.HANDLE_ERROR,
        [OBJECT_GRAPH_EDGES.RETRY]: OBJECT_GRAPH_NODES.HANDLE_RETRY,
      },
    );

    // After type mapping, go to execution
    workflow.addConditionalEdges(
      OBJECT_GRAPH_NODES.TYPE_MAPPER,
      this.edgeRoutingStrategy.determineAfterMappingRoute.bind(this.edgeRoutingStrategy),
      {
        [OBJECT_GRAPH_EDGES.EXECUTE]: OBJECT_GRAPH_NODES.OBJECT_EXECUTOR,
        [OBJECT_GRAPH_EDGES.ERROR]: OBJECT_GRAPH_NODES.HANDLE_ERROR,
        [OBJECT_GRAPH_EDGES.RETRY]: OBJECT_GRAPH_NODES.HANDLE_RETRY,
      },
    );

    // After execution, go to success or handle error
    workflow.addConditionalEdges(
      OBJECT_GRAPH_NODES.OBJECT_EXECUTOR,
      this.edgeRoutingStrategy.determineAfterExecutionRoute.bind(this.edgeRoutingStrategy),
      {
        [OBJECT_GRAPH_EDGES.SUCCESS]: OBJECT_GRAPH_NODES.HANDLE_SUCCESS,
        [OBJECT_GRAPH_EDGES.ERROR]: OBJECT_GRAPH_NODES.HANDLE_ERROR,
        [OBJECT_GRAPH_EDGES.RETRY]: OBJECT_GRAPH_NODES.HANDLE_RETRY,
      },
    );

    workflow.addConditionalEdges(
      OBJECT_GRAPH_NODES.HANDLE_RETRY,
      this.edgeRoutingStrategy.determineRetryRoute.bind(this.edgeRoutingStrategy),
      {
        [OBJECT_GRAPH_EDGES.RETRY]: OBJECT_GRAPH_NODES.FIELD_UNDERSTANDING,
        [OBJECT_GRAPH_EDGES.EXECUTE]: OBJECT_GRAPH_NODES.OBJECT_EXECUTOR,
        [OBJECT_GRAPH_EDGES.ERROR]: OBJECT_GRAPH_NODES.HANDLE_ERROR,
      },
    );

    // Success and error nodes end the workflow
    workflow.addEdge(OBJECT_GRAPH_NODES.HANDLE_SUCCESS, END);
    workflow.addEdge(OBJECT_GRAPH_NODES.HANDLE_ERROR, END);

    return workflow.compile();
  }
}
