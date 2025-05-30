import { Module } from '@nestjs/common';
import { OpenAIModule } from 'src/shared/infrastructure/openai/openai.module';
import { PrismaModule } from 'src/shared/infrastructure/prisma/prisma.module';
import { SharedModule } from 'src/shared/shared.module';

import { LayoutAgentService } from './layout-agent.service';

@Module({
  imports: [OpenAIModule, PrismaModule, SharedModule],
  providers: [LayoutAgentService],
  exports: [LayoutAgentService],
})
export class LayoutAgentModule {}
