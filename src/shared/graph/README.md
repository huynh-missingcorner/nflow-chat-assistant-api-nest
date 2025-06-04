# Shared Graph Handler Architecture

This module provides a reusable, type-safe architecture for implementing graph handlers across different domain-specific graphs (coordinator, application, object, flow, layout).

## Overview

The architecture follows the DRY (Don't Repeat Yourself) principle by providing shared components that can be extended for specific graph implementations.

## Core Components

### 1. Base Graph Handler Service

**File:** `handlers/base-graph-handler.service.ts`

The `BaseGraphHandlerService` provides the core logic for handling graph execution states:

- **Success handling:** Logs completion and marks workflow as complete
- **Error handling:** Logs errors and marks workflow as failed
- **Retry handling:** Increments retry count and handles max retry scenarios

```typescript
export interface GraphStateBase {
  error?: string | null;
  retryCount?: number;
  currentNode?: string;
  isCompleted?: boolean;
}
```

### 2. Base Graph Node

**File:** `nodes/base-graph-node.ts`

The `BaseGraphNode` provides a common interface for all graph nodes:

```typescript
export abstract class BaseGraphNode<TState extends GraphStateBase> {
  abstract execute(state: TState): Promise<Partial<TState>> | Partial<TState>;
  protected abstract getNodeName(): string;
}
```

### 3. Generic Handler Nodes

**Files:**

- `nodes/handle-success.node.ts`
- `nodes/handle-error.node.ts`
- `nodes/handle-retry.node.ts`

These generic nodes can be instantiated for any graph type that extends `GraphStateBase`.

### 4. Generic Handler Node Factory

**File:** `factories/generic-handler-node.factory.ts`

A template factory that can be extended by specific graph implementations:

```typescript
export abstract class GenericHandlerNodeFactory<TState extends GraphStateBase> {
  protected abstract getGraphConstants(): GraphConstants;

  createSuccessNode(): GenericHandleSuccessNode<TState>;
  createErrorNode(): GenericHandleErrorNode<TState>;
  createRetryNode(): GenericHandleRetryNode<TState>;
}
```

## Implementation Pattern

### For Each Graph Type (Coordinator, Application, Object, etc.)

1. **Define Constants** - Graph-specific node names, config, and log messages
2. **Define State Types** - Must extend `GraphStateBase`
3. **Create Handler Factory** - Extend `GenericHandlerNodeFactory`
4. **Create Node Instances** - Use factory in concrete node implementations

### Example: Coordinator Graph

```typescript
// 1. Constants
export const GRAPH_NODES = {
  HANDLE_SUCCESS: 'handleSuccess',
  HANDLE_ERROR: 'handleError',
  HANDLE_RETRY: 'handleRetry',
} as const;

// 2. State (already extends GraphStateBase via LangGraph annotations)
export type CoordinatorStateType = typeof CoordinatorState.State;

// 3. Factory
@Injectable()
export class CoordinatorHandlerNodeFactory extends GenericHandlerNodeFactory<CoordinatorStateType> {
  protected getGraphConstants(): GraphConstants {
    return {
      nodes: {
        /* ... */
      },
      config: {
        /* ... */
      },
      logMessages: {
        /* ... */
      },
    };
  }
}

// 4. Concrete Node
@Injectable()
export class HandleSuccessNode extends GraphNodeBase {
  constructor(private readonly handlerFactory: CoordinatorHandlerNodeFactory) {
    super();
  }

  execute(state: CoordinatorStateType): Partial<CoordinatorStateType> {
    const successNode = this.handlerFactory.createSuccessNode();
    return successNode.execute(state);
  }
}
```

## Benefits

1. **DRY Compliance** - No duplicate handler logic across graphs
2. **Type Safety** - Full TypeScript support with generics
3. **Consistency** - Uniform behavior across all graph types
4. **Extensibility** - Easy to add new graph types (flow, layout, etc.)
5. **Maintainability** - Changes to core logic automatically apply to all graphs
6. **Testing** - Shared components can be tested once and reused

## Future Graph Types

To add a new graph type (e.g., Flow, Layout):

1. Create constants file with nodes, config, and log messages
2. Define state type extending `GraphStateBase`
3. Create factory extending `GenericHandlerNodeFactory`
4. Create concrete nodes using the factory
5. Register the factory as an injectable service

The shared infrastructure will handle all the retry logic, error handling, and state management automatically.

## Migration

Existing graph implementations have been updated to use this shared architecture:

- ✅ Coordinator Graph - Migrated
- ✅ Application Graph - Migrated
- ✅ Object Graph - Template created
- 🔄 Flow Graph - Ready for implementation
- 🔄 Layout Graph - Ready for implementation
