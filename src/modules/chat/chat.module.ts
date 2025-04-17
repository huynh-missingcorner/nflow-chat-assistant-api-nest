import { Module, forwardRef } from '@nestjs/common';
import { ChatService } from './services/chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatMessageService } from './services/chat-message.service';
import { CoordinatorAgentModule } from '../agents/coordinator-agent/coordinator-agent.module';
import { ChatMessageController } from './controllers/chat-message.controller';
import { ChatController } from './controllers/chat.controller';
import { ChatWebsocketService } from './services/chat-websocket.service';
import { OpenAIModule } from 'src/shared/infrastructure/openai/openai.module';

@Module({
  imports: [forwardRef(() => CoordinatorAgentModule), OpenAIModule],
  controllers: [ChatController, ChatMessageController],
  providers: [ChatService, ChatWebsocketService, ChatGateway, ChatMessageService],
  exports: [ChatService, ChatWebsocketService, ChatGateway, ChatMessageService],
})
export class ChatModule {}
