import { Module, Logger, forwardRef } from '@nestjs/common';
import { CoordinatorService } from './coordinator.service';
import { OpenAIModule } from 'src/shared/infrastructure/openai/openai.module';
import { IntentModule } from '../intent-agent/intent.module';
import { ApplicationModule } from '../application-agent/application.module';
import { ObjectModule } from '../object-agent/object.module';
import { FlowModule } from '../flow-agent/flow.module';
import { ChatModule } from 'src/modules/chat/chat.module';
import { LayoutModule } from '../layout-agent/layout.module';
import { ExecutorModule } from '../executor-agent/executor.module';

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
