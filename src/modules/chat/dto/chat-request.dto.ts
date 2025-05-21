import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChatRequestDto {
  @ApiProperty({
    description: 'Unique identifier for the chat session',
    example: 'abc123',
  })
  @IsString()
  @IsNotEmpty()
  readonly chatSessionId: string;

  @ApiProperty({
    description: 'Message content from the user',
    example: 'Build a task manager app with login and calendar',
  })
  @IsString()
  @IsNotEmpty()
  readonly message: string;
}
