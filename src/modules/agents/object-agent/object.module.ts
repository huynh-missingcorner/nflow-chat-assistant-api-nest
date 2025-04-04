import { Module } from '@nestjs/common';
import { OpenAIModule } from 'src/modules/openai/openai.module';
import { PrismaModule } from 'src/shared/infrastructure/prisma/prisma.module';
import { ObjectService } from './object.service';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [OpenAIModule, PrismaModule, SharedModule],
  providers: [ObjectService],
  exports: [ObjectService],
})
export class ObjectModule {}
