import { Injectable } from '@nestjs/common';
import { MemoryService } from 'src/modules/memory/memory.service';
import { ShortTermMemory } from 'src/modules/memory/types';
import { ChatSessionService } from '@/modules/chat-session/chat-session.service';

@Injectable()
export class BaseExecutorService {
  constructor(
    protected readonly memoryService: MemoryService,
    protected readonly chatSessionService: ChatSessionService,
  ) {}

  /**
   * Get userId from chatSessionId with authorization check
   * @param chatSessionId Chat session ID
   * @param requestUserId Optional requestUserId for authorization check
   * @returns userId associated with the chat session
   */
  protected async getUserId(chatSessionId: string, requestUserId?: string): Promise<string> {
    return this.chatSessionService.getUserIdFromChatSession(chatSessionId, requestUserId);
  }

  /**
   * Update the short term memory with new data
   * @param chatSessionId Chat session ID
   * @param updateFn Function that receives the current memory and returns updated memory
   */
  protected async updateMemory<T extends ShortTermMemory>(
    chatSessionId: string,
    updateFn: (currentMemory: T) => T,
  ): Promise<void> {
    const shortTermMemory = await this.memoryService.getContext(chatSessionId);
    const updatedMemory = updateFn(shortTermMemory as unknown as T);
    await this.memoryService.updateContext(shortTermMemory, updatedMemory);
  }
}
