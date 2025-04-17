import { MessageRole } from './chat-message.dto';

export interface WebSocketChatMessageDto {
  sessionId: string;
  message: string;
}

export interface WebSocketChatResponseDto {
  id: string;
  sessionId: string;
  content: string;
  role: MessageRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebSocketMessageChunkDto {
  chunk: string;
  timestamp: string;
}

export interface WebSocketSessionJoinDto {
  sessionId: string;
  timestamp: string;
}

export interface WebSocketMessageAckDto {
  messageId: string;
  timestamp: string;
}

export interface WebSocketErrorDto {
  message: string;
  error: string;
}

export interface WebSocketSessionTitleUpdatedDto {
  sessionId: string;
  title: string;
  timestamp: string;
}
