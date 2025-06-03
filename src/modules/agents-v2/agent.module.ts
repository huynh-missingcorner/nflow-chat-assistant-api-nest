import { Module } from '@nestjs/common';

import { ApplicationAgentModule } from './application/application-agent.module';
import { CoordinatorAgentModule } from './coordinator/coordinator-agent.module';
import { ObjectAgentService } from './object/object-agent.service';

@Module({
  imports: [CoordinatorAgentModule, ApplicationAgentModule],
  providers: [ObjectAgentService],
  exports: [ApplicationAgentModule, ObjectAgentService, CoordinatorAgentModule],
})
export class AgentModule {}
