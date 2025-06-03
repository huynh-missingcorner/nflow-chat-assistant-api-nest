import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AppController } from './app.controller';
import { ConfigModule } from './config/config.module';
import { CoordinatorAgentModule } from './modules/agents/coordinator-agent/coordinator-agent.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { ChatSessionModule } from './modules/chat-session/chat-session.module';
import { MemoryModule } from './modules/memory/memory.module';
import { InfrastructureModule } from './shared/infrastructure/infrastructure.module';
import { LangchainModule } from './shared/infrastructure/langchain/langchain.module';
import { PersistenceModule } from './shared/infrastructure/persistence/persistence.module';
import { RedisModule } from './shared/infrastructure/redis/redis.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    LangchainModule,
    ConfigModule,
    EventEmitterModule.forRoot(),
    InfrastructureModule,
    PersistenceModule,
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
