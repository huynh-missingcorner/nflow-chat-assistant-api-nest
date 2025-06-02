import { Module } from '@nestjs/common';

import { ApplicationAgentService } from './application/application-agent.service';
import { CoordinatorAgentService } from './coordinator/coordinator-agent.service';
import { ObjectAgentService } from './object/object-agent.service';

@Module({
  imports: [],
  providers: [ApplicationAgentService, ObjectAgentService, CoordinatorAgentService],
  exports: [ApplicationAgentService, ObjectAgentService, CoordinatorAgentService],
})
export class AgentModule {}
