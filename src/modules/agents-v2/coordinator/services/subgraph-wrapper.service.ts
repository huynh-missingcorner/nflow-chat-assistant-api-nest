import { Injectable } from '@nestjs/common';

import { ApplicationGraphBuilder } from '@/modules/agents-v2/application/builders/application-graph.builder';

import { CoordinatorStateType } from '../types/graph-state.types';
import {
  SubgraphDomain,
  SubgraphExecutionResult,
  SubgraphHandler,
} from '../types/subgraph-handler.types';
import { ApplicationSubgraphHandler } from './handlers/application-subgraph.handler';

@Injectable()
export class SubgraphWrapperService {
  private readonly subgraphHandlers: Map<SubgraphDomain, SubgraphHandler>;

  constructor(
    private readonly applicationGraphBuilder: ApplicationGraphBuilder,
    private readonly applicationSubgraphHandler: ApplicationSubgraphHandler,
  ) {
    this.subgraphHandlers = new Map();
    this.registerHandlers();
  }

  /**
   * Registers all available subgraph handlers
   */
  private registerHandlers(): void {
    this.subgraphHandlers.set('application', this.applicationSubgraphHandler);
    // Future handlers will be registered here:
    // this.subgraphHandlers.set('flow', this.flowSubgraphHandler);
    // this.subgraphHandlers.set('object', this.objectSubgraphHandler);
    // this.subgraphHandlers.set('layout', this.layoutSubgraphHandler);
  }

  /**
   * Gets the appropriate subgraph instance for the given domain
   */
  private getSubgraph(domain: SubgraphDomain) {
    switch (domain) {
      case 'application':
        return this.applicationGraphBuilder.buildGraph();
      // Future subgraphs will be added here:
      // case 'flow':
      //   return this.flowGraphBuilder.buildGraph();
      // case 'object':
      //   return this.objectGraphBuilder.buildGraph();
      // case 'layout':
      //   return this.layoutGraphBuilder.buildGraph();
      default:
        throw new Error(`Unsupported subgraph domain: ${domain}`);
    }
  }

  /**
   * Creates a wrapper function for any subgraph domain that handles
   * preparation, execution, and post-processing in a single step
   */
  createSubgraphWrapper(domain: SubgraphDomain) {
    return async (state: CoordinatorStateType): Promise<Partial<CoordinatorStateType>> => {
      try {
        const handler = this.subgraphHandlers.get(domain);
        if (!handler) {
          return {
            error: `No handler found for domain: ${domain}`,
          };
        }

        // === PREPARATION PHASE ===
        const validationResult = handler.validateContext(state);
        if (!validationResult.isValid) {
          return {
            error: `${domain} preparation failed: ${validationResult.errors.join(', ')}`,
          };
        }

        // === EXECUTION PHASE ===
        const subgraphInput = handler.transformToSubgraphState(state);
        const subgraph = this.getSubgraph(domain);
        const subgraphOutput = await subgraph.invoke(subgraphInput);

        // === POST-PROCESSING PHASE ===
        const postValidationResult = handler.validateSubgraphResults(subgraphOutput);
        if (!postValidationResult.isValid) {
          return {
            error: `${domain} execution validation failed: ${postValidationResult.errors.join(', ')}`,
          };
        }

        // Transform subgraph state back to coordinator state
        return handler.transformToCoordinatorState(subgraphOutput, state);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
          error: `${domain} subgraph execution failed: ${errorMessage}`,
        };
      }
    };
  }

  /**
   * Executes a subgraph for the specified domain
   */
  async executeSubgraph(
    domain: SubgraphDomain,
    state: CoordinatorStateType,
  ): Promise<SubgraphExecutionResult> {
    try {
      const wrapper = this.createSubgraphWrapper(domain);
      const result = await wrapper(state);

      if (result.error) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Subgraph execution failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Gets the current intent domain from the coordinator state
   */
  getCurrentIntentDomain(state: CoordinatorStateType): SubgraphDomain | null {
    if (
      !state.classifiedIntent ||
      state.currentIntentIndex >= state.classifiedIntent.intents.length
    ) {
      return null;
    }

    const currentIntent = state.classifiedIntent.intents[state.currentIntentIndex];
    return currentIntent.domain as SubgraphDomain;
  }

  /**
   * Checks if a domain is supported
   */
  isDomainSupported(domain: string): domain is SubgraphDomain {
    return this.subgraphHandlers.has(domain as SubgraphDomain);
  }
}
