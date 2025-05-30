import { Module } from '@nestjs/common';

import { MemoryModule } from '@/modules/memory/memory.module';
import { OpenAIModule } from '@/shared/infrastructure/openai/openai.module';

import { IntentAgentService } from './intent-agent.service';

@Module({
  imports: [OpenAIModule, MemoryModule],
  providers: [IntentAgentService],
  exports: [IntentAgentService],
})
export class IntentAgentModule {}
