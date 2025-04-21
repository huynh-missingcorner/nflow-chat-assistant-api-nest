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
import { Logger } from '@nestjs/common';
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

@WebSocketGateway({
  cors: {
    origin: '*', // TODO: Update this to match your frontend origin in production
  },
})
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
  handleSessionTitleUpdated(payload: { sessionId: string; title: string }): void {
    const { sessionId, title } = payload;
    this.emitSessionTitleUpdate(sessionId, title);
  }

  /**
   * Emit a session title update event to all clients in the session
   * @param sessionId The session ID
   * @param title The new session title
   */
  private emitSessionTitleUpdate(sessionId: string, title: string): void {
    const titleUpdate: WebSocketSessionTitleUpdatedDto = {
      sessionId,
      title,
      timestamp: new Date().toISOString(),
    };
    this.server.to(sessionId).emit('sessionTitleUpdated', titleUpdate);
    this.logger.debug(`Emitted title update for session ${sessionId}: ${title}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
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

      // Save the user message to history
      await this.chatMessageService.create({
        sessionId: payload.sessionId,
        content: payload.message,
        role: MessageRole.USER,
      });

      // Process the message
      const response = await this.chatWebsocketService.processMessage(
        payload.sessionId,
        payload.message,
      );

      // Save the assistant response to history
      const responseMessage = await this.chatMessageService.create({
        sessionId: payload.sessionId,
        content: response,
        role: MessageRole.ASSISTANT,
      });

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
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string },
  ): Promise<void> {
    try {
      const messages = await this.chatMessageService.findAllBySessionId(payload.sessionId);
      client.emit('sessionMessages', {
        sessionId: payload.sessionId,
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
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string },
  ): Promise<void> {
    await client.join(payload.sessionId);
    this.logger.log(`Client ${client.id} joined session: ${payload.sessionId}`);

    // Acknowledge the join
    const response: WebSocketSessionJoinDto = {
      sessionId: payload.sessionId,
      timestamp: new Date().toISOString(),
    };
    client.emit('sessionJoined', response);

    // Send existing messages for this session
    try {
      const messages = await this.chatMessageService.findAllBySessionId(payload.sessionId);
      client.emit('sessionMessages', {
        sessionId: payload.sessionId,
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
    @MessageBody() payload: { sessionId: string },
  ): Promise<void> {
    await client.leave(payload.sessionId);
    this.logger.log(`Client ${client.id} left session: ${payload.sessionId}`);
  }
}
