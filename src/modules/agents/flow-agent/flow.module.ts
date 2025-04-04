import { Module } from '@nestjs/common';
import { OpenAIModule } from 'src/modules/openai/openai.module';
import { PrismaModule } from 'src/shared/infrastructure/prisma/prisma.module';
import { SharedModule } from 'src/shared/shared.module';
import { FlowService } from './flow.service';

@Module({
  imports: [OpenAIModule, PrismaModule, SharedModule],
  providers: [FlowService],
  exports: [FlowService],
})
export class FlowModule {}
