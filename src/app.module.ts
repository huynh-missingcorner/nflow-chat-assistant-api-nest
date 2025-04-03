import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InfrastructureModule } from './shared/infrastructure/infrastructure.module';
import { ConfigModule } from './config/config.module';
import { ChatModule } from './modules/chat/chat.module';
import { CoordinatorModule } from './modules/coordinator/coordinator.module';
import { HistoryModule } from './modules/history/history.module';
import { OpenAIModule } from './modules/openai/openai.module';

@Module({
  imports: [
    ConfigModule,
    InfrastructureModule,
    ChatModule,
    CoordinatorModule,
    HistoryModule,
    OpenAIModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
