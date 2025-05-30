import { Module } from '@nestjs/common';
import { ApplicationAgentService } from './application/application-agent.service';
import { ObjectAgentService } from './object/object-agent.service';
import { CoordinatorAgentService } from './coordinator/coordinator-agent.service';

@Module({
  imports: [],
  providers: [ApplicationAgentService, ObjectAgentService, CoordinatorAgentService],
  exports: [],
})
export class AgentModule {}
