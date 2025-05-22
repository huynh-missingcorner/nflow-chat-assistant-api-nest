import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { ChatWebsocketService } from './services/chat-websocket.service';
import { ChatMessageService } from './services/chat-message.service';
import { MessageRole } from './dto/chat-message.dto';
import { OnEvent } from '@nestjs/event-emitter';
import {
  WebSocketChatMessageDto,
  WebSocketMessageAckDto,
  WebSocketSessionJoinDto,
  WebSocketErrorDto,
  WebSocketSessionTitleUpdatedDto,
} from './dto/websocket.dto';
import { WsKeycloakAuthGuard } from '../auth/guards/ws-keycloak-auth.guard';

// Define interface for socket data with user info
interface SocketWithAuth extends Socket {
  data: {
    user: {
      userId: string;
    };
  };
}

@WebSocketGateway({ cors: true })
@UseGuards(WsKeycloakAuthGuard)
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatWebsocketService: ChatWebsocketService,
    private readonly chatMessageService: ChatMessageService,
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit(): void {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket): void {
    const { id } = client;
    this.logger.log(`Client connected: ${id}`);
  }

  handleDisconnect(client: Socket): void {
    const { id } = client;
    this.logger.log(`Client disconnected: ${id}`);
  }

  /**
   * Listen for session.title.updated events and emit session title updates to clients
   */
  @OnEvent('session.title.updated')
  handleSessionTitleUpdated(payload: { chatSessionId: string; title: string }): void {
    const { chatSessionId, title } = payload;
    this.emitSessionTitleUpdate(chatSessionId, title);
  }

  /**
   * Emit a session title update event to all clients in the session
   * @param chatSessionId The session ID
   * @param title The new session title
   */
  private emitSessionTitleUpdate(chatSessionId: string, title: string): void {
    const titleUpdate: WebSocketSessionTitleUpdatedDto = {
      chatSessionId: chatSessionId,
      title,
      timestamp: new Date().toISOString(),
    };
    this.server.to(chatSessionId).emit('sessionTitleUpdated', titleUpdate);
    this.logger.debug(`Emitted title update for session ${chatSessionId}: ${title}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() payload: WebSocketChatMessageDto,
  ): Promise<void> {
    this.logger.debug(`Received message from ${client.id}: ${JSON.stringify(payload)}`);

    try {
      // First, acknowledge receipt
      const ack: WebSocketMessageAckDto = {
        messageId: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
      client.emit('messageReceived', ack);

      console.log('client.data', client.data);

      // Get userId from socket data
      if (!client.data?.user?.userId) {
        throw new Error('User not authenticated');
      }
      const userId = client.data.user.userId;

      // Save the user message to history
      await this.chatMessageService.create(
        {
          chatSessionId: payload.chatSessionId,
          content: payload.message,
          role: MessageRole.USER,
        },
        userId,
      );

      // Process the message
      const response = await this.chatWebsocketService.processMessage(
        payload.chatSessionId,
        payload.message,
        userId,
      );

      // Save the assistant response to history
      const responseMessage = await this.chatMessageService.create(
        {
          chatSessionId: payload.chatSessionId,
          content: response,
          role: MessageRole.ASSISTANT,
        },
        userId,
      );

      client.emit('messageResponse', responseMessage);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Error processing message: ${error.message}`);
        const errorResponse: WebSocketErrorDto = {
          message: 'Failed to process your message',
          error: error.message,
        };
        client.emit('error', errorResponse);
      } else {
        this.logger.error('Unknown error occurred');
        const errorResponse: WebSocketErrorDto = {
          message: 'An unexpected error occurred',
          error: 'Unknown error',
        };
        client.emit('error', errorResponse);
      }
    }
  }

  @SubscribeMessage('getSessionMessages')
  async handleGetSessionMessages(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() payload: { chatSessionId: string },
  ): Promise<void> {
    try {
      // Get userId from socket data
      if (!client.data?.user?.userId) {
        throw new Error('User not authenticated');
      }
      const userId = client.data.user.userId;

      const messages = await this.chatMessageService.findAllBySessionId(
        payload.chatSessionId,
        userId,
      );
      client.emit('sessionMessages', {
        chatSessionId: payload.chatSessionId,
        messages,
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Error fetching session messages: ${error.message}`);
        const errorResponse: WebSocketErrorDto = {
          message: 'Failed to fetch session messages',
          error: error.message,
        };
        client.emit('error', errorResponse);
      } else {
        this.logger.error('Unknown error occurred fetching session messages');
        const errorResponse: WebSocketErrorDto = {
          message: 'An unexpected error occurred',
          error: 'Unknown error',
        };
        client.emit('error', errorResponse);
      }
    }
  }

  @SubscribeMessage('joinSession')
  async handleJoinSession(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() payload: { chatSessionId: string },
  ): Promise<void> {
    await client.join(payload.chatSessionId);
    this.logger.log(`Client ${client.id} joined session: ${payload.chatSessionId}`);

    // Acknowledge the join
    const response: WebSocketSessionJoinDto = {
      chatSessionId: payload.chatSessionId,
      timestamp: new Date().toISOString(),
    };
    client.emit('sessionJoined', response);

    // Send existing messages for this session
    try {
      // Get userId from socket data
      if (!client.data?.user?.userId) {
        throw new Error('User not authenticated');
      }
      const userId = client.data.user.userId;

      const messages = await this.chatMessageService.findAllBySessionId(
        payload.chatSessionId,
        userId,
      );
      client.emit('sessionMessages', {
        chatSessionId: payload.chatSessionId,
        messages,
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? `Error fetching session messages: ${error.message}`
          : 'Unknown error occurred fetching session messages';
      this.logger.error(errorMessage);
    }
  }

  @SubscribeMessage('leaveSession')
  async handleLeaveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatSessionId: string },
  ): Promise<void> {
    await client.leave(payload.chatSessionId);
    this.logger.log(`Client ${client.id} left session: ${payload.chatSessionId}`);
  }
}
