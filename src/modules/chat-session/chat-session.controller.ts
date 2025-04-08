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
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChatSessionService } from './chat-session.service';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { UpdateChatSessionDto } from './dto/update-chat-session.dto';

@ApiTags('Chat Sessions')
@Controller('chat-sessions')
export class ChatSessionController {
  constructor(private readonly chatSessionService: ChatSessionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new chat session' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The chat session has been successfully created.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request parameters.' })
  create(@Body() createChatSessionDto: CreateChatSessionDto) {
    return this.chatSessionService.create(createChatSessionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all chat sessions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all chat sessions.',
  })
  findAll() {
    return this.chatSessionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a chat session by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The chat session has been found.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chat session not found.' })
  findOne(@Param('id') id: string) {
    return this.chatSessionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a chat session' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The chat session has been successfully updated.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chat session not found.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request parameters.' })
  update(@Param('id') id: string, @Body() updateChatSessionDto: UpdateChatSessionDto) {
    return this.chatSessionService.update(id, updateChatSessionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a chat session' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The chat session has been successfully deleted.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chat session not found.' })
  remove(@Param('id') id: string) {
    return this.chatSessionService.remove(id);
  }
}
