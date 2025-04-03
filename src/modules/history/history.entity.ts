/**
 * Entity representing a chat message in history
 */
export class ChatMessage {
  /**
   * Unique identifier for the message
   */
  id: string;

  /**
   * Session identifier this message belongs to
   */
  sessionId: string;

  /**
   * Role of the message sender (user or assistant)
   */
  role: 'user' | 'assistant';

  /**
   * Content of the message
   */
  content: string;

  /**
   * Timestamp when the message was created
   */
  createdAt: Date;
}
