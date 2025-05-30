import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/shared/infrastructure/prisma/prisma.module';
import { SharedModule } from 'src/shared/shared.module';

import { OpenAIModule } from '../../../shared/infrastructure/openai/openai.module';
import { ApplicationAgentService } from './application-agent.service';

@Module({
  imports: [OpenAIModule, PrismaModule, SharedModule],
  providers: [ApplicationAgentService],
  exports: [ApplicationAgentService],
})
export class ApplicationAgentModule {}
