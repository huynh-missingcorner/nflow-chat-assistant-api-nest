import { Module } from '@nestjs/common';
import { ObjectAgentService } from './object-agent.service';

@Module({
  providers: [ObjectAgentService],
  exports: [ObjectAgentService],
})
export class ObjectAgentModule {}
