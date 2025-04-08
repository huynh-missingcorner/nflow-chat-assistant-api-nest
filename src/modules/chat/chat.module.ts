import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { WebsocketService } from './websocket.service';
import { HistoryModule } from '../history/history.module';
import { CoordinatorModule } from '../coordinator/coordinator.module';

@Module({
  imports: [HistoryModule, CoordinatorModule],
  controllers: [ChatController],
  providers: [ChatService, WebsocketService, ChatGateway],
  exports: [ChatService, WebsocketService, ChatGateway],
})
export class ChatModule {}
