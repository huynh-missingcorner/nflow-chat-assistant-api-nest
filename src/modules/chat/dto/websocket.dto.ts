export interface WebSocketChatMessageDto {
  sessionId: string;
  message: string;
}

export interface WebSocketChatResponseDto {
  message: string;
  timestamp: string;
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
