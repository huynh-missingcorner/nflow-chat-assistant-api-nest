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
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChatSessionService } from './chat-session.service';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { UpdateChatSessionDto } from './dto/update-chat-session.dto';
import { NflowAuthGuard } from '@/modules/auth/guards/nflow-auth.guard';
import { AuthenticatedUser } from '@/shared/decorators/user.decorator';

@ApiTags('Chat Sessions')
@Controller('chat-sessions')
@UseGuards(NflowAuthGuard)
export class ChatSessionController {
  constructor(private readonly chatSessionService: ChatSessionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new chat session' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The chat session has been successfully created.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request parameters.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User not authenticated.' })
  create(
    @Body() createChatSessionDto: CreateChatSessionDto,
    @AuthenticatedUser() user: { userId: string },
  ) {
    return this.chatSessionService.create(createChatSessionDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all chat sessions for the authenticated user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all chat sessions for the user.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User not authenticated.' })
  findAll(@AuthenticatedUser() user: { userId: string }) {
    return this.chatSessionService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a chat session by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The chat session has been found.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chat session not found.' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access to this chat session is forbidden.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User not authenticated.' })
  findOne(@Param('id') id: string, @AuthenticatedUser() user: { userId: string }) {
    return this.chatSessionService.findOne(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a chat session' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The chat session has been successfully updated.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chat session not found.' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access to this chat session is forbidden.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request parameters.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User not authenticated.' })
  update(
    @Param('id') id: string,
    @Body() updateChatSessionDto: UpdateChatSessionDto,
    @AuthenticatedUser() user: { userId: string },
  ) {
    return this.chatSessionService.update(id, updateChatSessionDto, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a chat session' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The chat session has been successfully deleted.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chat session not found.' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access to this chat session is forbidden.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User not authenticated.' })
  remove(@Param('id') id: string, @AuthenticatedUser() user: { userId: string }) {
    return this.chatSessionService.remove(id, user.userId);
  }
}
