# Subgraph Wrapper System

This directory contains the generic subgraph wrapper system that allows the coordinator to execute different domain-specific subgraphs (application, flow, object, layout) in a consistent manner.

## Architecture

### Core Components

1. **SubgraphWrapperService** - Generic service that orchestrates subgraph execution
2. **SubgraphHandler Interface** - Contract that all domain handlers must implement
3. **Domain-specific Handlers** - Implement domain-specific logic for each subgraph type

### Current Structure

```
services/
├── subgraph-wrapper.service.ts     # Generic wrapper service
├── handlers/
│   ├── application-subgraph.handler.ts  # Application domain (implemented)
│   ├── flow-subgraph.handler.ts         # Flow domain (placeholder)
│   ├── object-subgraph.handler.ts       # Object domain (placeholder)
│   ├── layout-subgraph.handler.ts       # Layout domain (placeholder)
│   └── index.ts                         # Barrel exports
└── README.md                            # This file
```

## How It Works

1. **Coordinator Graph Builder** uses `SubgraphWrapperService.createSubgraphWrapper(domain)` to get a wrapper function
2. **SubgraphWrapperService** routes to the appropriate domain handler based on the domain type
3. **Domain Handler** implements the specific logic for that domain:
   - Context validation
   - Message building
   - State transformation
   - Result validation

## Adding a New Subgraph Handler

To add support for a new domain (e.g., 'flow'), follow these steps:

### 1. Update Types

Add the new domain to `SubgraphDomain` in `../types/subgraph-handler.types.ts`:

```typescript
export type SubgraphDomain = 'application' | 'flow' | 'object' | 'layout' | 'your-new-domain';
```

### 2. Create the Handler

Implement the `SubgraphHandler` interface in `handlers/your-domain-subgraph.handler.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { YourDomainStateType } from '@/modules/agents-v2/your-domain/types/your-domain-graph-state.types';
import { SubgraphHandler } from '../../types/subgraph-handler.types';

@Injectable()
export class YourDomainSubgraphHandler implements SubgraphHandler<YourDomainStateType> {
  validateContext(state: CoordinatorStateType): ValidationResult {
    // Implement domain-specific validation
  }

  buildSubgraphMessage(intent: IntentDetails, originalMessage: string): string {
    // Implement domain-specific message building
  }

  validateSubgraphResults(output: YourDomainStateType): ValidationResult {
    // Implement domain-specific result validation
  }

  transformToSubgraphState(state: CoordinatorStateType): Partial<YourDomainStateType> {
    // Transform coordinator state to domain state
  }

  transformToCoordinatorState(
    output: YourDomainStateType,
    coordinatorState: CoordinatorStateType,
  ): Partial<CoordinatorStateType> {
    // Transform domain state back to coordinator state
  }
}
```

### 3. Register the Handler

Update `SubgraphWrapperService.registerHandlers()`:

```typescript
private registerHandlers(): void {
  this.subgraphHandlers.set('application', this.applicationSubgraphHandler);
  this.subgraphHandlers.set('your-domain', this.yourDomainSubgraphHandler);
  // ... other handlers
}
```

### 4. Add Graph Builder

Update `SubgraphWrapperService.getSubgraph()`:

```typescript
private getSubgraph(domain: SubgraphDomain) {
  switch (domain) {
    case 'application':
      return this.applicationGraphBuilder.buildGraph();
    case 'your-domain':
      return this.yourDomainGraphBuilder.buildGraph();
    // ... other cases
  }
}
```

### 5. Update Constructor

Add the new handler and graph builder to the constructor:

```typescript
constructor(
  private readonly applicationGraphBuilder: ApplicationGraphBuilder,
  private readonly yourDomainGraphBuilder: YourDomainGraphBuilder,
  private readonly applicationSubgraphHandler: ApplicationSubgraphHandler,
  private readonly yourDomainSubgraphHandler: YourDomainSubgraphHandler,
) {
  // ...
}
```

### 6. Update Graph Constants

Add any new graph edges or nodes to `../constants/graph-constants.ts` if needed:

```typescript
export const GRAPH_NODES = {
  // ... existing nodes
  YOUR_DOMAIN_SUBGRAPH: 'your-domain-subgraph',
} as const;

export const GRAPH_EDGES = {
  // ... existing edges
  YOUR_DOMAIN: 'your-domain',
} as const;
```

### 7. Update Edge Routing Strategy

Update the edge routing strategy to handle the new domain in `../strategies/edge-routing.strategy.ts`.

## Best Practices

1. **Validation**: Always validate both input context and output results
2. **Error Handling**: Provide clear, actionable error messages
3. **State Isolation**: Each subgraph should work with clean state
4. **Testing**: Write comprehensive tests for each handler
5. **Documentation**: Document domain-specific requirements and behavior

## Testing

Each handler should have:

- Unit tests for all methods
- Integration tests for the complete flow
- Mock implementations for dependencies

Example test structure:

```
handlers/
├── __tests__/
│   ├── application-subgraph.handler.spec.ts
│   ├── flow-subgraph.handler.spec.ts
│   └── your-domain-subgraph.handler.spec.ts
```

## Current Status

- ✅ **Application**: Fully implemented and functional
- 🚧 **Flow**: Placeholder with TODO comments
- 🚧 **Object**: Placeholder with TODO comments
- 🚧 **Layout**: Placeholder with TODO comments

## Migration Notes

This refactoring moved application-specific logic from `CoordinatorGraphBuilder` to `ApplicationSubgraphHandler`, making the system more modular and extensible. The old methods have been completely removed and replaced with the generic wrapper system.
