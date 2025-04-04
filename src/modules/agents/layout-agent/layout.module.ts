import { Module } from '@nestjs/common';
import { OpenAIModule } from 'src/modules/openai/openai.module';
import { PrismaModule } from 'src/shared/infrastructure/prisma/prisma.module';
import { SharedModule } from 'src/shared/shared.module';
import { LayoutService } from './layout.service';

@Module({
  imports: [OpenAIModule, PrismaModule, SharedModule],
  providers: [LayoutService],
  exports: [LayoutService],
})
export class LayoutModule {}
