import { Module } from '@nestjs/common';
import { CoordinatorService } from './coordinator.service';
import { OpenaiModule } from '../openai/openai.module';

@Module({
  imports: [OpenaiModule],
  providers: [CoordinatorService],
  exports: [CoordinatorService],
})
export class CoordinatorModule {}
