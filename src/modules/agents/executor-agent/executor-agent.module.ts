import { Module } from '@nestjs/common';
import { ExecutorAgentService } from './executor-agent.service';
import { NFlowModule } from '../../nflow/nflow.module';

@Module({
  imports: [NFlowModule],
  providers: [ExecutorAgentService],
  exports: [ExecutorAgentService],
})
export class ExecutorAgentModule {}
