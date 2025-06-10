import { Injectable } from '@nestjs/common';

import { GRAPH_NODES } from '../constants/graph-constants';
import { CoordinatorStateType } from '../types/graph-state.types';
import { GraphNodeBase } from './graph-node.base';

@Injectable()
export class ProcessNextIntentNode extends GraphNodeBase {
  execute(state: CoordinatorStateType): Partial<CoordinatorStateType> {
    try {
      if (!state.classifiedIntent || !state.classifiedIntent.intents.length) {
        return this.handleError(new Error('No intents to process'), 'processing next intent');
      }

      if (state.currentIntentIndex >= state.classifiedIntent.intents.length) {
        return this.createSuccessResult({
          currentNode: GRAPH_NODES.HANDLE_SUCCESS,
        });
      }

      if (state.classifiedIntent.dependencies) {
        const dependencies = state.classifiedIntent.dependencies.filter(
          (dep) => dep.dependentIntentIndex === state.currentIntentIndex,
        );

        // Check if all dependencies have been processed
        for (const dependency of dependencies) {
          if (!state.processedIntents.includes(dependency.dependsOnIntentIndex)) {
            this.logger.debug(
              `Intent ${state.currentIntentIndex} depends on intent ${dependency.dependsOnIntentIndex} which has not been processed yet. Processing dependency first.`,
            );

            // Update to process the dependency first
            return this.createSuccessResult({
              currentIntentIndex: dependency.dependsOnIntentIndex,
            });
          }
        }
      }

      // Redirect to process the intent if all dependencies are processed
      return this.createSuccessResult({});
    } catch (error) {
      return this.handleError(error, 'processing next intent');
    }
  }

  protected getNodeName(): string {
    return GRAPH_NODES.PROCESS_NEXT_INTENT;
  }
}
