import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { KeycloakService } from '@/modules/auth/services/keycloak.service';
import { RedisSessionService } from '@/shared/services/redis-session.service';

import { NFLOW_API_ENDPOINTS } from '../constants/api-endpoints';
import { CreateLayoutDto, LayoutResponse } from '../types';
import { BaseNFlowService } from './base.service';

@Injectable()
export class NFlowLayoutService extends BaseNFlowService {
  constructor(
    httpService: HttpService,
    configService: ConfigService,
    redisSessionService: RedisSessionService,
    keycloakService: KeycloakService,
  ) {
    super(
      httpService,
      configService,
      redisSessionService,
      keycloakService,
      NFlowLayoutService.name,
    );
  }

  async createLayout(data: CreateLayoutDto, userId: string): Promise<LayoutResponse> {
    return this.post(NFLOW_API_ENDPOINTS.BUILDER.LAYOUTS.CREATE_LAYOUT, userId, data);
  }
}
