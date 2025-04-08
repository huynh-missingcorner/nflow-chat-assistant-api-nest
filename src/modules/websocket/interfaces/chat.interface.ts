export interface ChatMessageDto {
  sessionId: string;
  message: string;
}

export interface ChatResponseDto {
  message: string;
  timestamp: string;
}

export interface MessageChunkDto {
  chunk: string;
  timestamp: string;
}

export interface SessionJoinDto {
  sessionId: string;
  timestamp: string;
}

export interface MessageAckDto {
  messageId: string;
  timestamp: string;
}

export interface ErrorDto {
  message: string;
  error: string;
}
