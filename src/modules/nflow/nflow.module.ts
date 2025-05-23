import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { NFlowObjectService } from './services/object.service';
import { NFlowApplicationService } from './services/application.service';
import { NFlowFlowService } from './services/flow.service';
import { NFlowLayoutService } from './services/layout.service';
import { SharedModule } from 'src/shared/shared.module';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule,
    SharedModule,
    AuthModule,
  ],
  providers: [NFlowApplicationService, NFlowObjectService, NFlowFlowService, NFlowLayoutService],
  exports: [NFlowApplicationService, NFlowObjectService, NFlowFlowService, NFlowLayoutService],
})
export class NFlowModule {}
