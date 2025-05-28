import { Module } from '@nestjs/common';
import { ApplicationAgentService } from './application-agent.service';

@Module({
  providers: [ApplicationAgentService],
  exports: [ApplicationAgentService],
})
export class ApplicationAgentModule {}
