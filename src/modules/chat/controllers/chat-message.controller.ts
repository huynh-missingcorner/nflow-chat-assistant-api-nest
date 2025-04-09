import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ChatMessageService } from '../services/chat-message.service';
import {
  CreateMessageDto,
  MessageResponseDto,
  UpdateMessageDto,
  DeleteMessageResponseDto,
} from '../dto/chat-message.dto';

@ApiTags('Chat Messages')
@Controller('chat-messages')
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
  async create(@Body() createMessageDto: CreateMessageDto): Promise<MessageResponseDto> {
    return this.chatMessageService.create(createMessageDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all chat messages or filter by session ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of chat messages.',
    type: [MessageResponseDto],
  })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    description: 'Filter messages by session ID',
  })
  async findAll(@Query('sessionId') sessionId?: string): Promise<MessageResponseDto[]> {
    if (sessionId) {
      return this.chatMessageService.findAllBySessionId(sessionId);
    }
    return this.chatMessageService.findAll();
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
  async findOne(@Param('id') id: string): Promise<MessageResponseDto> {
    return this.chatMessageService.findOne(id);
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
  async update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ): Promise<MessageResponseDto> {
    return this.chatMessageService.update(id, updateMessageDto);
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
  async remove(@Param('id') id: string): Promise<DeleteMessageResponseDto> {
    const success = await this.chatMessageService.remove(id);
    return {
      success,
      message: 'Message deleted successfully',
    };
  }

  @Delete('session/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete all messages for a chat session' })
  @ApiParam({
    name: 'sessionId',
    description: 'The ID of the chat session',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The chat messages have been successfully deleted.',
  })
  async removeAllBySession(
    @Param('sessionId') sessionId: string,
  ): Promise<{ deletedCount: number }> {
    const deletedCount = await this.chatMessageService.removeAllBySessionId(sessionId);
    return { deletedCount };
  }
}
