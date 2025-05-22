import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BaseNFlowService } from './base.service';
import { CreateLayoutDto, LayoutResponse } from '../types';
import { RedisSessionService } from 'src/shared/services/redis-session.service';
import { KeycloakService } from 'src/modules/auth/services/keycloak.service';

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
    return this.makeRequest('POST', '/builder/layouts', data, {}, userId);
  }
}
