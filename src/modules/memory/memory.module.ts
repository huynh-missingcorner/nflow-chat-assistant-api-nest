import { forwardRef, Module } from '@nestjs/common';

import { CoordinatorAgentModule } from '../agents/coordinator-agent/coordinator-agent.module';
import { ChatModule } from '../chat/chat.module';
import { MEMORY_SERVICE } from './const';
import { MemoryService } from './memory.service';

@Module({
  imports: [forwardRef(() => ChatModule), forwardRef(() => CoordinatorAgentModule)],
  providers: [
    MemoryService,
    {
      provide: MEMORY_SERVICE,
      useExisting: MemoryService,
    },
  ],
  exports: [MEMORY_SERVICE],
})
export class MemoryModule {}
