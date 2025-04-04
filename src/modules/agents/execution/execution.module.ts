import { Module } from '@nestjs/common';
import { ExecutionService } from './execution.service';
import { PrismaModule } from 'src/shared/infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ExecutionService],
  exports: [ExecutionService],
})
export class ExecutionModule {}
