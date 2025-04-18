import { Module } from '@nestjs/common';
import { ClassifierAgentService } from './classifier-agent.service';
import { OpenAIModule } from 'src/shared/infrastructure/openai/openai.module';

@Module({
  imports: [OpenAIModule],
  providers: [ClassifierAgentService],
  exports: [ClassifierAgentService],
})
export class ClassifierAgentModule {}
