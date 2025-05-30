import { forwardRef, Module } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { ChatModule } from '../chat/chat.module';
import { CoordinatorAgentModule } from '../agents/coordinator-agent/coordinator-agent.module';
import { MEMORY_SERVICE } from './const';

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
