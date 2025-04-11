import { Module } from '@nestjs/common';
import { ExecutorService } from './executor.service';
import { NFlowModule } from '../../nflow/nflow.module';

@Module({
  imports: [NFlowModule],
  providers: [ExecutorService],
  exports: [ExecutorService],
})
export class ExecutorModule {}
