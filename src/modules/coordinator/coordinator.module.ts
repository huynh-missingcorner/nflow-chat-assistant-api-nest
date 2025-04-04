import { Module, Logger } from '@nestjs/common';
import { CoordinatorService } from './coordinator.service';
import { OpenAIModule } from 'src/shared/infrastructure/openai/openai.module';
import { IntentModule } from '../agents/intent-agent/intent.module';

@Module({
  imports: [OpenAIModule, IntentModule],
  providers: [CoordinatorService, Logger],
  exports: [CoordinatorService],
})
export class CoordinatorModule {}
