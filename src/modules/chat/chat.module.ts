import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatWebsocketService } from './chat-websocket.service';
import { HistoryModule } from '../history/history.module';
import { CoordinatorModule } from '../coordinator/coordinator.module';

@Module({
  imports: [HistoryModule, CoordinatorModule],
  controllers: [ChatController],
  providers: [ChatService, ChatWebsocketService, ChatGateway],
  exports: [ChatService, ChatWebsocketService, ChatGateway],
})
export class ChatModule {}
