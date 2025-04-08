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
import { ChatService } from './chat.service';
import {
  ChatMessageDto,
  ChatResponseDto,
  MessageAckDto,
  SessionJoinDto,
  ErrorDto,
} from './interfaces/chat.interface';

@WebSocketGateway({
  cors: {
    origin: '*', // Update this to match your frontend origin in production
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

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

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ChatMessageDto,
  ): Promise<void> {
    this.logger.debug(`Received message from ${client.id}: ${JSON.stringify(payload)}`);

    try {
      // First, acknowledge receipt
      const ack: MessageAckDto = {
        messageId: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
      client.emit('messageReceived', ack);

      // Process the message
      const response = await this.chatService.processMessage(payload.sessionId, payload.message);

      // Option 1: Simple response
      const chatResponse: ChatResponseDto = {
        message: response,
        timestamp: new Date().toISOString(),
      };
      this.server.to(payload.sessionId).emit('messageResponse', chatResponse);

      // Option 2: Stream the response (commented out for now)
      // const chunks = await this.chatService.streamResponse(
      //   payload.sessionId,
      //   response,
      // );
      //
      // for (const chunk of chunks) {
      //   this.server.to(payload.sessionId).emit('messageChunk', {
      //     chunk,
      //     timestamp: new Date().toISOString(),
      //   });
      //   await new Promise(resolve => setTimeout(resolve, 100)); // Simulate streaming
      // }
      //
      // this.server.to(payload.sessionId).emit('messageComplete', {
      //   timestamp: new Date().toISOString(),
      // });
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Error processing message: ${error.message}`);
        const errorResponse: ErrorDto = {
          message: 'Failed to process your message',
          error: error.message,
        };
        client.emit('error', errorResponse);
      } else {
        this.logger.error('Unknown error occurred');
        const errorResponse: ErrorDto = {
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
    const response: SessionJoinDto = {
      sessionId: payload.sessionId,
      timestamp: new Date().toISOString(),
    };
    client.emit('sessionJoined', response);
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
