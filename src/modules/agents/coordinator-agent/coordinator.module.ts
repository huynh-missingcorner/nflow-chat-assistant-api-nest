import { forwardRef, Module } from '@nestjs/common';
import { CoordinatorService } from './coordinator.service';
import { IntentModule } from '../intent-agent/intent.module';
import { ApplicationModule } from '../application-agent/application.module';
import { ObjectModule } from '../object-agent/object.module';
import { LayoutModule } from '../layout-agent/layout.module';
import { FlowModule } from '../flow-agent/flow.module';
import { ExecutorModule } from '../executor-agent/executor.module';
import { ChatModule } from 'src/modules/chat/chat.module';
import { ToolNameGeneratorService } from './services/tool-name-generator.service';
import { TaskExecutorService } from './services/task-executor.service';
import { ChatContextService } from './services/chat-context.service';
import { OpenAIModule } from 'src/shared/infrastructure/openai/openai.module';

@Module({
  imports: [
    OpenAIModule,
    IntentModule,
    ApplicationModule,
    ObjectModule,
    LayoutModule,
    FlowModule,
    ExecutorModule,
    forwardRef(() => ChatModule),
  ],
  providers: [
    CoordinatorService,
    ToolNameGeneratorService,
    TaskExecutorService,
    ChatContextService,
  ],
  exports: [CoordinatorService],
})
export class CoordinatorModule {}
