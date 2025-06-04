import { CoordinatorStateType } from './graph-state.types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SubgraphHandler<TSubgraphState = any> {
  validateContext(state: CoordinatorStateType): ValidationResult;
  buildSubgraphMessage(intent: IntentDetails, originalMessage: string): string;
  validateSubgraphResults(subgraphOutput: TSubgraphState): ValidationResult;
  transformToSubgraphState(state: CoordinatorStateType): Partial<TSubgraphState>;
  transformToCoordinatorState(
    subgraphOutput: TSubgraphState,
    coordinatorState: CoordinatorStateType,
  ): Partial<CoordinatorStateType>;
}

export interface IntentDetails {
  intent: string;
  details?: any;
  target?: any;
  domain: string;
}

export interface SubgraphExecutionResult<TSubgraphState = any> {
  success: boolean;
  data?: Partial<CoordinatorStateType>;
  error?: string;
  subgraphOutput?: TSubgraphState;
}

export type SubgraphDomain = 'application' | 'flow' | 'object' | 'layout';
