import { Module } from '@nestjs/common';
import { OpenAIModule } from 'src/shared/infrastructure/openai/openai.module';
import { IntentAgentService } from './intent-agent.service';

@Module({
  imports: [OpenAIModule],
  providers: [IntentAgentService],
  exports: [IntentAgentService],
})
export class IntentAgentModule {}
