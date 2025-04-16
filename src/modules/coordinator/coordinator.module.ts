import { Module, Logger, forwardRef } from '@nestjs/common';
import { CoordinatorService } from './coordinator.service';
import { OpenAIModule } from 'src/shared/infrastructure/openai/openai.module';
import { IntentModule } from '../agents/intent-agent/intent.module';
import { ApplicationModule } from '../agents/application-agent/application.module';
import { LayoutModule } from '../agents/layout-agent/layout.module';
import { FlowModule } from '../agents/flow-agent/flow.module';
import { ObjectModule } from '../agents/object-agent/object.module';
import { ExecutorModule } from '../agents/executor-agent/executor.module';
import { ChatModule } from '../chat/chat.module';
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
  providers: [CoordinatorService, Logger],
  exports: [CoordinatorService],
})
export class CoordinatorModule {}
