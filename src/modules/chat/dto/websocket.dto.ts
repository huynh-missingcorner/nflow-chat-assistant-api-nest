export interface WebSocketChatMessageDto {
  chatSessionId: string;
  message: string;
}

export interface WebSocketMessageChunkDto {
  chunk: string;
  timestamp: string;
}

export interface WebSocketSessionJoinDto {
  chatSessionId: string;
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
  chatSessionId: string;
  title: string;
  timestamp: string;
}
