import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

import { BaseNFlowService } from './base.service';
import { CreateApplicationDto, UpdateApplicationDto, BuilderAppResponse } from '../types';
import { RedisSessionService } from 'src/shared/services/redis-session.service';
import { KeycloakService } from 'src/modules/auth/services/keycloak.service';

@Injectable()
export class NFlowApplicationService extends BaseNFlowService {
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
      NFlowApplicationService.name,
    );
  }

  async createApp(data: CreateApplicationDto, userId: string): Promise<BuilderAppResponse> {
    if (!data.credentials) {
      data.credentials = [];
    }
    if (!data.profiles) {
      data.profiles = [];
    }
    return this.makeRequest(
      'POST',
      '/builder/apps',
      {
        ...data,
        profiles: ['admin'],
        credentials: [],
      },
      {},
      userId,
    );
  }

  async updateApp(data: UpdateApplicationDto, userId: string): Promise<BuilderAppResponse> {
    const { name, ...updateData } = data;
    return this.makeRequest(
      'PUT',
      `/builder/apps/${name}`,
      {
        ...updateData,
        profiles: ['admin'],
        credentials: [],
      },
      {},
      userId,
    );
  }

  async getApp(name: string, userId: string): Promise<BuilderAppResponse> {
    return this.makeRequest('GET', `/builder/apps/${name}`, undefined, {}, userId);
  }

  async deleteApp(name: string, userId: string): Promise<void> {
    return this.makeRequest(
      'POST',
      `/builder/apps/remove`,
      {
        names: [name],
      },
      {},
      userId,
    );
  }
}
