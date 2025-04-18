export type MessageType = 'nflow_action' | 'context_query' | 'casual_chat';

export interface ClassificationResult {
  type: MessageType;

  message: string;
}
