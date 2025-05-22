import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BaseNFlowService } from './base.service';
import { FlowCreateDto, FlowResponse } from '../types';
import { RedisSessionService } from 'src/shared/services/redis-session.service';
import { KeycloakService } from 'src/modules/auth/services/keycloak.service';

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
