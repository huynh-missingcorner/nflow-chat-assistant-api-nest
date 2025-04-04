import { Module } from '@nestjs/common';
import { OpenAIModule } from '../../openai/openai.module';
import { PrismaModule } from 'src/shared/infrastructure/prisma/prisma.module';
import { ApplicationService } from './application.service';

@Module({
  imports: [OpenAIModule, PrismaModule],
  providers: [ApplicationService],
  exports: [ApplicationService],
})
export class ApplicationModule {}
