import { Module } from '@nestjs/common';

import { ApplicationAgentService } from './application/application-agent.service';
import { CoordinatorGraphModule } from './coordinator/graph/coordinator-graph.module';
import { ObjectAgentService } from './object/object-agent.service';

@Module({
  imports: [CoordinatorGraphModule],
  providers: [ApplicationAgentService, ObjectAgentService],
  exports: [ApplicationAgentService, ObjectAgentService, CoordinatorGraphModule],
})
export class AgentModule {}
