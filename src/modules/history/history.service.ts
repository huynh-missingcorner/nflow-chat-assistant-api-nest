import { Injectable } from '@nestjs/common';

/**
 * Service for managing chat history
 */
@Injectable()
export class HistoryService {
  // This is a simplified implementation that would use a database in production
  private readonly sessionHistory: Record<string, { role: string; content: string }[]> = {};

  /**
   * Get the chat history for a session
   * @param sessionId Unique identifier for the session
   * @returns Array of chat messages
   */
  async getSessionHistory(sessionId: string): Promise<any[]> {
    return this.sessionHistory[sessionId] || [];
  }

  /**
   * Save a chat interaction to history
   * @param sessionId Unique identifier for the session
   * @param userMessage Message from the user
   * @param assistantReply Reply from the assistant
   */
  async saveInteraction(
    sessionId: string,
    userMessage: string,
    assistantReply: string,
  ): Promise<void> {
    if (!this.sessionHistory[sessionId]) {
      this.sessionHistory[sessionId] = [];
    }

    // Add user message
    this.sessionHistory[sessionId].push({
      role: 'user',
      content: userMessage,
    });

    // Add assistant reply
    this.sessionHistory[sessionId].push({
      role: 'assistant',
      content: assistantReply,
    });
  }
}
