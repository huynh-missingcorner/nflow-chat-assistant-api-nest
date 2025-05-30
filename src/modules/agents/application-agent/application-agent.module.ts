import { Module } from '@nestjs/common';

import { OpenAIModule } from '@/shared/infrastructure/openai/openai.module';
import { PrismaModule } from '@/shared/infrastructure/prisma/prisma.module';
import { SharedModule } from '@/shared/shared.module';

import { ApplicationAgentService } from './application-agent.service';

@Module({
  imports: [OpenAIModule, PrismaModule, SharedModule],
  providers: [ApplicationAgentService],
  exports: [ApplicationAgentService],
})
export class ApplicationAgentModule {}
