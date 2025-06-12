import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { KeycloakService } from '@/modules/auth/services/keycloak.service';
import { RedisSessionService } from '@/shared/services/redis-session.service';

import { NFLOW_API_ENDPOINTS } from '../constants/api-endpoints';
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
    return this.post(NFLOW_API_ENDPOINTS.BUILDER.APPS.CREATE_APP, userId, {
      ...data,
      profiles: ['admin'],
      credentials: [],
      tagNames: [],
    });
  }

  async updateApp(data: UpdateApplicationDto, userId: string): Promise<BuilderAppResponse> {
    const { name, ...updateData } = data;
    return this.put(NFLOW_API_ENDPOINTS.BUILDER.APPS.UPDATE_APP(name), userId, {
      ...updateData,
      profiles: ['admin'],
      credentials: [],
    });
  }

  async getApp(name: string, userId: string): Promise<BuilderAppResponse> {
    return this.get(NFLOW_API_ENDPOINTS.BUILDER.APPS.GET_APP(name), userId);
  }

  async deleteApp(name: string, userId: string): Promise<void> {
    return this.post(NFLOW_API_ENDPOINTS.BUILDER.APPS.REMOVE_APPS, userId, {
      names: [name],
    });
  }
}
