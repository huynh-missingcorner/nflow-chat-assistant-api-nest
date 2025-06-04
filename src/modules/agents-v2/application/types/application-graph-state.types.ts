import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';

export type ApplicationOperationType =
  | 'create_application'
  | 'update_application'
  | 'delete_application';

export interface ApplicationSpec {
  appName: string;
  description?: string;
  objects?: string[];
  layouts?: string[];
  flows?: string[];
  metadata?: Record<string, unknown>;
  operationType?: ApplicationOperationType;
}

export interface EnrichedApplicationSpec extends ApplicationSpec {
  appId?: string;
  objectIds?: string[];
  layoutIds?: string[];
  flowIds?: string[];
  dependencies?: string[];
  profiles?: string[];
  tagNames?: string[];
  credentials?: string[];
  apiParameters?: Record<string, unknown>;
}

export interface ApplicationExecutionResult {
  appId: string;
  operationType: ApplicationOperationType;
  status: 'success' | 'partial' | 'failed';
  result?: any;
  errors?: string[];
}

// Define the state schema for the application graph
export const ApplicationState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  originalMessage: Annotation<string>(),
  chatSessionId: Annotation<string>(),
  operationType: Annotation<ApplicationOperationType | null>({
    default: () => null,
    reducer: (x, y) => y ?? x,
  }),
  applicationSpec: Annotation<ApplicationSpec | null>({
    default: () => null,
    reducer: (x, y) => y ?? x,
  }),
  enrichedSpec: Annotation<EnrichedApplicationSpec | null>({
    default: () => null,
    reducer: (x, y) => y ?? x,
  }),
  executionResult: Annotation<ApplicationExecutionResult | null>({
    default: () => null,
    reducer: (x, y) => y ?? x,
  }),
  error: Annotation<string | null>({
    default: () => null,
    reducer: (x, y) => y ?? x,
  }),
  currentNode: Annotation<string>({
    default: () => 'start',
    reducer: (x, y) => y ?? x,
  }),
  retryCount: Annotation<number>({
    default: () => 0,
    reducer: (x, y) => y ?? x,
  }),
  isCompleted: Annotation<boolean>({
    default: () => false,
    reducer: (x, y) => y ?? x,
  }),
});

export type ApplicationStateType = typeof ApplicationState.State;

export interface ApplicationGraphNodeResult {
  success: boolean;
  data?: Partial<ApplicationStateType>;
  error?: string;
}

export interface ApplicationGraphConfiguration {
  maxRetryCount: number;
  defaultThreadId: string;
  initialNode: string;
}

export interface ApplicationNodeExecutionContext {
  state: ApplicationStateType;
  config?: ApplicationGraphConfiguration;
}
