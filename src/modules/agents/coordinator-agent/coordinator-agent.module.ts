import { forwardRef, Module } from '@nestjs/common';

import { ChatModule } from '@/modules/chat/chat.module';
import { MemoryModule } from '@/modules/memory/memory.module';
import { OpenAIModule } from '@/shared/infrastructure/openai/openai.module';

import { ApplicationAgentModule } from '../application-agent/application-agent.module';
import { ClassifierAgentModule } from '../classifier-agent/classifier-agent.module';
import { ExecutorAgentModule } from '../executor-agent/executor-agent.module';
import { FlowAgentModule } from '../flow-agent/flow-agent.module';
import { IntentAgentModule } from '../intent-agent/intent-agent.module';
import { LayoutAgentModule } from '../layout-agent/layout-agent.module';
import { ObjectAgentModule } from '../object-agent/object-agent.module';
import { CoordinatorAgentService } from './coordinator-agent.service';
import { ChatContextService } from './services/chat-context.service';
import { TaskExecutorService } from './services/task-executor.service';

@Module({
  imports: [
    OpenAIModule,
    IntentAgentModule,
    ApplicationAgentModule,
    ObjectAgentModule,
    LayoutAgentModule,
    FlowAgentModule,
    ExecutorAgentModule,
    forwardRef(() => MemoryModule),
    forwardRef(() => ChatModule),
    ClassifierAgentModule,
  ],
  providers: [CoordinatorAgentService, TaskExecutorService, ChatContextService],
  exports: [CoordinatorAgentService, ChatContextService],
})
export class CoordinatorAgentModule {}
