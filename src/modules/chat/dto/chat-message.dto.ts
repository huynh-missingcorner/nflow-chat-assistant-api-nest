import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
  DEVELOPER = 'DEVELOPER',
}

export class CreateMessageDto {
  @ApiProperty({
    description: 'The unique identifier of the chat session',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  chatSessionId: string;

  @ApiProperty({
    description: 'The content of the message',
    example: 'Can you build me a CRM app?',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'The role of the message sender',
    enum: MessageRole,
    example: MessageRole.USER,
    default: MessageRole.USER,
  })
  @IsEnum(MessageRole)
  @IsOptional()
  role: MessageRole = MessageRole.USER;
}

export class MessageResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the message',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The unique identifier of the chat session',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  chatSessionId: string;

  @ApiProperty({
    description: 'The content of the message',
    example: 'Can you build me a CRM app?',
  })
  content: string;

  @ApiProperty({
    description: 'The role of the message sender',
    enum: MessageRole,
    example: MessageRole.USER,
  })
  role: MessageRole;

  @ApiProperty({
    description: 'The timestamp when the message was created',
    example: '2023-04-08T12:34:56.789Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The timestamp when the message was last updated',
    example: '2023-04-08T12:34:56.789Z',
  })
  updatedAt: Date;
}

export class UpdateMessageDto {
  @ApiProperty({
    description: 'The content of the message',
    example: 'Can you build me a CRM app with user authentication?',
  })
  @IsString()
  @IsOptional()
  content?: string;
}

export class DeleteMessageResponseDto {
  @ApiProperty({
    description: 'Whether the message was successfully deleted',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'The message returned from the operation',
    example: 'Message deleted successfully',
  })
  message: string;
}
