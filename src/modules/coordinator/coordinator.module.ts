import { Module } from '@nestjs/common';
import { CoordinatorService } from './coordinator.service';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [OpenAIModule],
  providers: [CoordinatorService],
  exports: [CoordinatorService],
})
export class CoordinatorModule {}
