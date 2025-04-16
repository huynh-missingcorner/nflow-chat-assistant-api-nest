import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InfrastructureModule } from './shared/infrastructure/infrastructure.module';
import { ConfigModule } from './config/config.module';
import { ChatModule } from './modules/chat/chat.module';
import { CoordinatorModule } from './modules/agents/coordinator-agent/coordinator.module';
import { SharedModule } from './shared/shared.module';
import { ChatSessionModule } from './modules/chat-session/chat-session.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot(),
    InfrastructureModule,
    ChatModule,
    CoordinatorModule,
    SharedModule,
    ChatSessionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
