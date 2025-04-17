import { Module } from '@nestjs/common';
import { OpenAIModule } from 'src/shared/infrastructure/openai/openai.module';
import { PrismaModule } from 'src/shared/infrastructure/prisma/prisma.module';
import { SharedModule } from 'src/shared/shared.module';
import { FlowAgentService } from './flow-agent.service';

@Module({
  imports: [OpenAIModule, PrismaModule, SharedModule],
  providers: [FlowAgentService],
  exports: [FlowAgentService],
})
export class FlowAgentModule {}
