import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { KeycloakService } from '@/modules/auth/services/keycloak.service';
import { RedisSessionService } from '@/shared/services/redis-session.service';

import { BuilderAppResponse, CreateApplicationDto, UpdateApplicationDto } from '../types';
import { BaseNFlowService } from './base.service';

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
