import { Module } from '@nestjs/common';

import { ApplicationAgentModule } from './application/application-agent.module';
import { CoordinatorGraphModule } from './coordinator/graph/coordinator-graph.module';
import { ObjectAgentService } from './object/object-agent.service';

@Module({
  imports: [CoordinatorGraphModule, ApplicationAgentModule],
  providers: [ObjectAgentService],
  exports: [ApplicationAgentModule, ObjectAgentService, CoordinatorGraphModule],
})
export class AgentModule {}
