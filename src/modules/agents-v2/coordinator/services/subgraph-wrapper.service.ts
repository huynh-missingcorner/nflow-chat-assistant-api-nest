import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { ApplicationGraphBuilder } from '@/modules/agents-v2/application/builders/application-graph.builder';
import { ObjectGraphBuilder } from '@/modules/agents-v2/object/builders/object-graph.builder';

import { CoordinatorStateType, IntentError } from '../types/graph-state.types';
import {
  SubgraphDomain,
  SubgraphExecutionResult,
  SubgraphHandler,
} from '../types/subgraph-handler.types';
import { ApplicationSubgraphHandler } from './handlers/application-subgraph.handler';
import { ObjectSubgraphHandler } from './handlers/object-subgraph.handler';

@Injectable()
export class SubgraphWrapperService {
  private readonly subgraphHandlers: Map<SubgraphDomain, SubgraphHandler>;

  constructor(
    private readonly applicationGraphBuilder: ApplicationGraphBuilder,
    private readonly objectGraphBuilder: ObjectGraphBuilder,
    private readonly applicationSubgraphHandler: ApplicationSubgraphHandler,
    private readonly objectSubgraphHandler: ObjectSubgraphHandler,
  ) {
    this.subgraphHandlers = new Map();
    this.registerHandlers();
  }

  /**
   * Registers all available subgraph handlers
   */
  private registerHandlers(): void {
    this.subgraphHandlers.set('application', this.applicationSubgraphHandler);
    this.subgraphHandlers.set('object', this.objectSubgraphHandler);
    // Future handlers will be registered here:
    // this.subgraphHandlers.set('flow', this.flowSubgraphHandler);
    // this.subgraphHandlers.set('layout', this.layoutSubgraphHandler);
  }

  /**
   * Gets the appropriate subgraph instance for the given domain
   */
  private getSubgraph(domain: SubgraphDomain) {
    switch (domain) {
      case 'application':
        return this.applicationGraphBuilder.buildGraph();
      case 'object':
        return this.objectGraphBuilder.buildGraph();
      // Future subgraphs will be added here:
      // case 'flow':
      //   return this.flowGraphBuilder.buildGraph();
      // case 'layout':
      //   return this.layoutGraphBuilder.buildGraph();
      default:
        throw new Error(`Unsupported subgraph domain: ${domain}`);
    }
  }

  /**
   * Creates an intent error for the current intent or a general error
   */
  private createIntentError(
    state: CoordinatorStateType,
    errorMessage: string,
    retryCount: number = 0,
  ): IntentError[] {
    const currentIntent = state.classifiedIntent?.intents[state.currentIntentIndex];
    const intentId = currentIntent?.id || `general-error-${uuidv4()}`;

    return [
      {
        intentId,
        errorMessage,
        timestamp: new Date().toISOString(),
        retryCount,
      },
    ];
  }

  /**
   * Creates a wrapper function for any subgraph domain that handles
   * preparation, execution, and post-processing in a single step
   */
  createSubgraphWrapper(domain: SubgraphDomain) {
    return async (state: CoordinatorStateType): Promise<Partial<CoordinatorStateType>> => {
      console.log('createSubgraphWrapper running...');
      try {
        const handler = this.subgraphHandlers.get(domain);
        if (!handler) {
          // Create error and increment intent index to prevent loop
          return {
            errors: [
              ...(state.errors || []),
              ...this.createIntentError(state, `No handler found for domain: ${domain}`),
            ],
            processedIntents: [...(state.processedIntents || []), state.currentIntentIndex],
            currentIntentIndex: state.currentIntentIndex + 1,
          };
        }

        // === PREPARATION PHASE ===
        const validationResult = handler.validateContext(state);
        if (!validationResult.isValid) {
          // Create error and increment intent index to prevent loop
          return {
            errors: [
              ...(state.errors || []),
              ...this.createIntentError(
                state,
                `${domain} preparation failed: ${validationResult.errors.join(', ')}`,
              ),
            ],
            processedIntents: [...(state.processedIntents || []), state.currentIntentIndex],
            currentIntentIndex: state.currentIntentIndex + 1,
          };
        }

        // === EXECUTION PHASE ===
        const subgraphInput = handler.transformToSubgraphState(state);
        const subgraph = this.getSubgraph(domain);
        const subgraphOutput = await subgraph.invoke(subgraphInput);

        // === POST-PROCESSING PHASE ===
        const postValidationResult = handler.validateSubgraphResults(subgraphOutput);
        if (!postValidationResult.isValid) {
          // Create error and increment intent index to prevent loop
          return {
            errors: [
              ...(state.errors || []),
              ...this.createIntentError(
                state,
                `${domain} execution validation failed: ${postValidationResult.errors.join(', ')}`,
              ),
            ],
            processedIntents: [...(state.processedIntents || []), state.currentIntentIndex],
            currentIntentIndex: state.currentIntentIndex + 1,
          };
        }

        // Transform subgraph state back to coordinator state
        return handler.transformToCoordinatorState(subgraphOutput, state);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        // Create error and increment intent index to prevent loop
        return {
          errors: [
            ...(state.errors || []),
            ...this.createIntentError(
              state,
              `${domain} subgraph execution failed: ${errorMessage}`,
            ),
          ],
          processedIntents: [...(state.processedIntents || []), state.currentIntentIndex],
          currentIntentIndex: state.currentIntentIndex + 1,
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

      if (result.errors && result.errors.length > 0) {
        return {
          success: false,
          error: result.errors.map((e) => e.errorMessage).join('; '),
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
