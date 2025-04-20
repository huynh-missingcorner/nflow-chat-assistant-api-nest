import { Module } from '@nestjs/common';
import { ExecutorAgentService } from './executor-agent.service';
import { NFlowModule } from '../../nflow/nflow.module';
import { FlowExecutorService } from './services/flow-executor.service';
import { ObjectExecutorService } from './services/object-executor.service';
import { AppExecutorService } from './services/app-executor.service';
import { LayoutExecutorService } from './services/layout-executor.service';
import { MemoryModule } from 'src/modules/memory/memory.module';

@Module({
  imports: [NFlowModule, MemoryModule],
  providers: [
    ExecutorAgentService,
    LayoutExecutorService,
    FlowExecutorService,
    AppExecutorService,
    ObjectExecutorService,
  ],
  exports: [ExecutorAgentService],
})
export class ExecutorAgentModule {}
