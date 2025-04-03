import { ApiProperty } from '@nestjs/swagger';

export class ChatResponseDto {
  @ApiProperty({
    description: 'The reply message from the AI assistant',
    example: "Your app is ready! Here's the link to view it in Nflow.",
  })
  readonly reply: string;

  @ApiProperty({
    description: 'URL to the created application in Nflow',
    example: 'https://nflow.so/app/xyz456',
    required: false,
  })
  readonly appUrl?: string;
}
