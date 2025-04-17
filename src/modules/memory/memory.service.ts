import { Injectable } from '@nestjs/common';
import { SessionContext, CreatedObject } from './types';
import { ChatContextService } from '../agents/coordinator-agent/services/chat-context.service';
import { ProcessedTasks } from '../agents/executor-agent/types/executor.types';

@Injectable()
export class MemoryService {
  private sessionContexts: Map<string, SessionContext> = new Map();

  constructor(private readonly chatContextService: ChatContextService) {}

  /**
   * Get the session context for a session ID
   * @param sessionId The session ID
   * @returns The session context
   */
  public async getContext(sessionId: string): Promise<SessionContext> {
    // Check if we already have a context for this session
    let context = this.sessionContexts.get(sessionId);

    if (!context) {
      // Create a new context with chat history
      const chatHistory = await this.chatContextService.getChatContext(sessionId);

      context = {
        sessionId,
        chatHistory,
        createdObjects: [],
        createdLayouts: [],
        createdFlows: [],
        toolCallsLog: [],
        taskResults: {},
        timestamp: new Date(),
      };

      // Store the new context
      this.sessionContexts.set(sessionId, context);
    }

    return context;
  }

  /**
   * Apply a patch to the session context
   * @param context The current session context
   * @param patchData The data to patch onto the context
   * @returns The updated session context
   */
  public patch(context: SessionContext, patchData: Partial<SessionContext>): SessionContext {
    const updatedContext = {
      ...context,
      ...patchData,
      // Merge arrays properly instead of replacing them
      createdObjects: [...(context.createdObjects || []), ...(patchData.createdObjects || [])],
      createdLayouts: [...(context.createdLayouts || []), ...(patchData.createdLayouts || [])],
      createdFlows: [...(context.createdFlows || []), ...(patchData.createdFlows || [])],
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      toolCallsLog: [...(context.toolCallsLog || []), ...(patchData.toolCallsLog || [])],
      // Merge task results
      taskResults: { ...(context.taskResults || {}), ...(patchData.taskResults || {}) },
      // Update timestamp
      timestamp: new Date(),
    };

    // Store the updated context
    this.sessionContexts.set(context.sessionId, updatedContext);

    return updatedContext;
  }

  /**
   * Reset the session context
   * @param sessionId The session ID
   */
  public reset(sessionId: string) {
    this.sessionContexts.delete(sessionId);
  }

  /**
   * Find an object by name in the session context
   * @param context The session context
   * @param objectName The name of the object to find
   * @returns The found object or undefined
   */
  public findObjectByName(context: SessionContext, objectName: string): CreatedObject | undefined {
    return context.createdObjects.find(
      (obj) => obj.name.toLowerCase() === objectName.toLowerCase(),
    );
  }

  /**
   * Get the last created application
   * @param context The session context
   * @returns The last created application or undefined
   */
  public getLastCreatedApplication(context: SessionContext): SessionContext['application'] {
    return context.application;
  }

  /**
   * Update task results in the session context
   * @param sessionId The session ID
   * @param results The task results to update
   */
  public async updateTaskResults(sessionId: string, results: ProcessedTasks): Promise<void> {
    const context = await this.getContext(sessionId);

    context.taskResults = {
      ...context.taskResults,
      ...results.results,
    };

    this.sessionContexts.set(sessionId, context);
  }
}
