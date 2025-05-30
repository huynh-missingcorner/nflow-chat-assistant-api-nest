import { forwardRef, Module } from '@nestjs/common';

import { OpenAIModule } from '@/shared/infrastructure/openai/openai.module';

import { CoordinatorAgentModule } from '../agents/coordinator-agent/coordinator-agent.module';
import { AuthModule } from '../auth/auth.module';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './controllers/chat.controller';
import { ChatMessageController } from './controllers/chat-message.controller';
import { ChatService } from './services/chat.service';
import { ChatMessageService } from './services/chat-message.service';
import { ChatWebsocketService } from './services/chat-websocket.service';

@Module({
  imports: [forwardRef(() => CoordinatorAgentModule), OpenAIModule, AuthModule],
  controllers: [ChatController, ChatMessageController],
  providers: [ChatService, ChatWebsocketService, ChatGateway, ChatMessageService],
  exports: [ChatService, ChatWebsocketService, ChatGateway, ChatMessageService],
})
export class ChatModule {}
