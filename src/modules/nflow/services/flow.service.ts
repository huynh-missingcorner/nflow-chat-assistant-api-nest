import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { KeycloakService } from '@/modules/auth/services/keycloak.service';
import { RedisSessionService } from '@/shared/services/redis-session.service';

import { NFLOW_API_ENDPOINTS } from '../constants/api-endpoints';
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
    return this.post(NFLOW_API_ENDPOINTS.FLOWS.CREATE_FLOW, userId, data);
  }
}
