import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  providers: [ChatGateway, ChatService],
  exports: [ChatGateway],
})
export class WebsocketModule {}
