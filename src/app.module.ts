import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { InfrastructureModule } from './shared/infrastructure/infrastructure.module';
import { ConfigModule } from './config/config.module';
import { ChatModule } from './modules/chat/chat.module';
import { CoordinatorAgentModule } from './modules/agents/coordinator-agent/coordinator-agent.module';
import { SharedModule } from './shared/shared.module';
import { ChatSessionModule } from './modules/chat-session/chat-session.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MemoryModule } from './modules/memory/memory.module';
import { RedisModule } from './shared/infrastructure/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot(),
    InfrastructureModule,
    ChatModule,
    CoordinatorAgentModule,
    SharedModule,
    ChatSessionModule,
    MemoryModule,
    RedisModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
