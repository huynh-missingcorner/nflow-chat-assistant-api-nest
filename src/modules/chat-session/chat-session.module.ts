import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { ChatSessionController } from './chat-session.controller';
import { ChatSessionService } from './chat-session.service';

@Module({
  imports: [PrismaModule],
  controllers: [ChatSessionController],
  providers: [ChatSessionService],
  exports: [ChatSessionService],
})
export class ChatSessionModule {}
