import { Inject, Injectable } from '@nestjs/common';

import { ChatSessionService } from '@/modules/chat-session/chat-session.service';
import { MEMORY_SERVICE } from '@/modules/memory/const';
import type { IMemoryService } from '@/modules/memory/interfaces';
import { ShortTermMemory } from '@/modules/memory/types';

@Injectable()
export class BaseExecutorService {
  constructor(
    @Inject(MEMORY_SERVICE) protected readonly memoryService: IMemoryService,
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
