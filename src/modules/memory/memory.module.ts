import { forwardRef, Module } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { ChatModule } from '../chat/chat.module';
import { CoordinatorAgentModule } from '../agents/coordinator-agent/coordinator-agent.module';

@Module({
  imports: [forwardRef(() => ChatModule), forwardRef(() => CoordinatorAgentModule)],
  providers: [MemoryService],
  exports: [MemoryService],
})
export class MemoryModule {}
