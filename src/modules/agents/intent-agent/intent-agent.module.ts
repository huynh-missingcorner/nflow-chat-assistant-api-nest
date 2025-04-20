import { Module } from '@nestjs/common';
import { OpenAIModule } from 'src/shared/infrastructure/openai/openai.module';
import { IntentAgentService } from './intent-agent.service';
import { MemoryModule } from 'src/modules/memory/memory.module';
@Module({
  imports: [OpenAIModule, MemoryModule],
  providers: [IntentAgentService],
  exports: [IntentAgentService],
})
export class IntentAgentModule {}
