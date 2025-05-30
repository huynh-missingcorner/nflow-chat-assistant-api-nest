import { Module } from '@nestjs/common';

import { OpenAIModule } from '@/shared/infrastructure/openai/openai.module';
import { PrismaModule } from '@/shared/infrastructure/prisma/prisma.module';
import { SharedModule } from '@/shared/shared.module';

import { FlowAgentService } from './flow-agent.service';

@Module({
  imports: [OpenAIModule, PrismaModule, SharedModule],
  providers: [FlowAgentService],
  exports: [FlowAgentService],
})
export class FlowAgentModule {}
