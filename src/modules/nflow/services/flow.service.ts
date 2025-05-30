import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KeycloakService } from 'src/modules/auth/services/keycloak.service';
import { RedisSessionService } from 'src/shared/services/redis-session.service';

import { FlowCreateDto, FlowResponse } from '../types';
import { BaseNFlowService } from './base.service';

@Injectable()
export class NFlowFlowService extends BaseNFlowService {
  constructor(
    httpService: HttpService,
    configService: ConfigService,
    redisSessionService: RedisSessionService,
    keycloakService: KeycloakService,
  ) {
    super(httpService, configService, redisSessionService, keycloakService, NFlowFlowService.name);
  }

  async createFlow(data: FlowCreateDto, userId: string): Promise<FlowResponse> {
    return this.makeRequest('POST', '/flows', data, {}, userId);
  }
}
