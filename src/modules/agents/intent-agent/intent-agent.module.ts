import { Module } from '@nestjs/common';
import { MemoryModule } from 'src/modules/memory/memory.module';
import { OpenAIModule } from 'src/shared/infrastructure/openai/openai.module';

import { IntentAgentService } from './intent-agent.service';

@Module({
  imports: [OpenAIModule, MemoryModule],
  providers: [IntentAgentService],
  exports: [IntentAgentService],
})
export class IntentAgentModule {}
