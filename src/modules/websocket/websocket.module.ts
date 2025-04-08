import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatModule } from '../chat/chat.module';
import { ChatService } from './chat.service';

@Module({
  imports: [ChatModule],
  providers: [ChatGateway, ChatService],
  exports: [ChatGateway],
})
export class WebsocketModule {}
