import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateChatSessionDto {
  @ApiProperty({
    description: 'Title of the chat session',
    example: 'Task Manager App Discussion',
  })
  @IsString()
  @IsNotEmpty()
  readonly title: string;
}
