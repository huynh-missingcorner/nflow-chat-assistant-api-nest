import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateChatSessionDto {
  @ApiProperty({
    description: 'Title of the chat session',
    example: 'Task Manager App Discussion',
    required: false,
  })
  @IsString()
  @IsOptional()
  readonly title?: string;

  @ApiProperty({
    description: 'Whether the chat session is archived',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  readonly archived?: boolean;
}
