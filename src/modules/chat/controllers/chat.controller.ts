import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { NflowAuthGuard } from '@/modules/auth/guards/nflow-auth.guard';
import { AuthenticatedUser } from '@/shared/decorators/user.decorator';

import { ChatRequestDto } from '../dto/chat-request.dto';
import { ChatResponseDto } from '../dto/chat-response.dto';
import { ChatService } from '../services/chat.service';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(NflowAuthGuard)
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
  @ApiResponse({ status: 403, description: 'Access to this chat session is forbidden' })
  @ApiResponse({ status: 401, description: 'User not authenticated' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async processMessage(
    @Body() chatRequestDto: ChatRequestDto,
    @AuthenticatedUser() user: { userId: string },
  ): Promise<ChatResponseDto> {
    return this.chatService.processMessage(chatRequestDto, user.userId);
  }
}
