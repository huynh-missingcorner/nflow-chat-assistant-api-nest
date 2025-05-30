import { Module } from '@nestjs/common';

import { OpenAIModule } from '@/shared/infrastructure/openai/openai.module';
import { PrismaModule } from '@/shared/infrastructure/prisma/prisma.module';
import { SharedModule } from '@/shared/shared.module';

import { LayoutAgentService } from './layout-agent.service';

@Module({
  imports: [OpenAIModule, PrismaModule, SharedModule],
  providers: [LayoutAgentService],
  exports: [LayoutAgentService],
})
export class LayoutAgentModule {}
