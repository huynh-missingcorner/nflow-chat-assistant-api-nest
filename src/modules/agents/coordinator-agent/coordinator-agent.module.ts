import { forwardRef, Module } from '@nestjs/common';
import { CoordinatorAgentService } from './coordinator-agent.service';
import { IntentAgentModule } from '../intent-agent/intent-agent.module';
import { ApplicationAgentModule } from '../application-agent/application-agent.module';
import { ObjectAgentModule } from '../object-agent/object-agent.module';
import { LayoutAgentModule } from '../layout-agent/layout-agent.module';
import { FlowAgentModule } from '../flow-agent/flow-agent.module';
import { ExecutorAgentModule } from '../executor-agent/executor-agent.module';
import { ChatModule } from 'src/modules/chat/chat.module';
import { ToolNameGeneratorService } from './services/tool-name-generator.service';
import { TaskExecutorService } from './services/task-executor.service';
import { ChatContextService } from './services/chat-context.service';
import { OpenAIModule } from 'src/shared/infrastructure/openai/openai.module';
import { MemoryModule } from '../../memory/memory.module';

@Module({
  imports: [
    OpenAIModule,
    IntentAgentModule,
    ApplicationAgentModule,
    ObjectAgentModule,
    LayoutAgentModule,
    FlowAgentModule,
    ExecutorAgentModule,
    forwardRef(() => ChatModule),
    forwardRef(() => MemoryModule),
  ],
  providers: [
    CoordinatorAgentService,
    ToolNameGeneratorService,
    TaskExecutorService,
    ChatContextService,
  ],
  exports: [CoordinatorAgentService, ChatContextService],
})
export class CoordinatorAgentModule {}
