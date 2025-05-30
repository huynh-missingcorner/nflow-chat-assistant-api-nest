import { Module } from '@nestjs/common';
import { OpenAIModule } from 'src/shared/infrastructure/openai/openai.module';

import { ClassifierAgentService } from './classifier-agent.service';

@Module({
  imports: [OpenAIModule],
  providers: [ClassifierAgentService],
  exports: [ClassifierAgentService],
})
export class ClassifierAgentModule {}
