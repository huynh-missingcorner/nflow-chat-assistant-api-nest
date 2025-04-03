import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Process a user message through the AI assistant' })
  @ApiResponse({
    status: 201,
    description: 'The message was successfully processed',
    type: ChatResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async processMessage(@Body() chatRequestDto: ChatRequestDto): Promise<ChatResponseDto> {
    return this.chatService.processMessage(chatRequestDto);
  }
}
