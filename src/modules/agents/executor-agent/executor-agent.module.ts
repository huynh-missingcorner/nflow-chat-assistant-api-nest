import { Module } from '@nestjs/common';
import { ChatSessionModule } from 'src/modules/chat-session/chat-session.module';
import { MemoryModule } from 'src/modules/memory/memory.module';
import { NFlowModule } from 'src/modules/nflow/nflow.module';

import { ExecutorAgentService } from './executor-agent.service';
import { AppExecutorService } from './services/app-executor.service';
import { FlowExecutorService } from './services/flow-executor.service';
import { LayoutExecutorService } from './services/layout-executor.service';
import { ObjectExecutorService } from './services/object-executor.service';

@Module({
  imports: [NFlowModule, MemoryModule, ChatSessionModule],
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
