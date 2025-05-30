import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { NflowAuthGuard } from '@/modules/auth/guards/nflow-auth.guard';
import { AuthenticatedUser } from '@/shared/decorators/user.decorator';

import {
  CreateMessageDto,
  DeleteMessageResponseDto,
  MessageResponseDto,
  UpdateMessageDto,
} from '../dto/chat-message.dto';
import { ChatMessageService } from '../services/chat-message.service';

@ApiTags('Chat Messages')
@Controller('chat-messages')
@UseGuards(NflowAuthGuard)
export class ChatMessageController {
  constructor(private readonly chatMessageService: ChatMessageService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new chat message' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The chat message has been successfully created.',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request parameters.' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access to this chat session is forbidden.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User not authenticated.' })
  async create(
    @Body() createMessageDto: CreateMessageDto,
    @AuthenticatedUser() user: { userId: string },
  ): Promise<MessageResponseDto> {
    return this.chatMessageService.create(createMessageDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all chat messages or filter by session ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of chat messages.',
    type: [MessageResponseDto],
  })
  @ApiQuery({
    name: 'chatSessionId',
    required: false,
    description: 'Filter messages by chat session ID',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access to this chat session is forbidden.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User not authenticated.' })
  async findAll(
    @AuthenticatedUser() user: { userId: string },
    @Query('chatSessionId') chatSessionId?: string,
  ): Promise<MessageResponseDto[]> {
    if (chatSessionId) {
      return this.chatMessageService.findAllBySessionId(chatSessionId, user.userId);
    }
    return this.chatMessageService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a chat message by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the chat message',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The chat message has been found.',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chat message not found.' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access to this message is forbidden.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User not authenticated.' })
  async findOne(
    @Param('id') id: string,
    @AuthenticatedUser() user: { userId: string },
  ): Promise<MessageResponseDto> {
    return this.chatMessageService.findOne(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a chat message' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the chat message',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The chat message has been successfully updated.',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chat message not found.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request parameters.' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access to this message is forbidden.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User not authenticated.' })
  async update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @AuthenticatedUser() user: { userId: string },
  ): Promise<MessageResponseDto> {
    return this.chatMessageService.update(id, updateMessageDto, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a chat message' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the chat message',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The chat message has been successfully deleted.',
    type: DeleteMessageResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chat message not found.' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access to this message is forbidden.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User not authenticated.' })
  async remove(
    @Param('id') id: string,
    @AuthenticatedUser() user: { userId: string },
  ): Promise<DeleteMessageResponseDto> {
    const success = await this.chatMessageService.remove(id, user.userId);
    return {
      success,
      message: 'Message deleted successfully',
    };
  }

  @Delete('session/:chatSessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete all messages for a chat session' })
  @ApiParam({
    name: 'chatSessionId',
    description: 'The ID of the chat session',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The chat messages have been successfully deleted.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chat session not found.' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access to this chat session is forbidden.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User not authenticated.' })
  async removeAllBySession(
    @Param('chatSessionId') chatSessionId: string,
    @AuthenticatedUser() user: { userId: string },
  ): Promise<{ deletedCount: number }> {
    const deletedCount = await this.chatMessageService.removeAllBySessionId(
      chatSessionId,
      user.userId,
    );
    return { deletedCount };
  }
}
