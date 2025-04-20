import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

import { BaseNFlowService } from './base.service';
import { CreateApplicationDto, UpdateApplicationDto, BuilderAppResponse } from '../types';

@Injectable()
export class NFlowApplicationService extends BaseNFlowService {
  constructor(httpService: HttpService, configService: ConfigService) {
    super(httpService, configService, NFlowApplicationService.name);
  }

  async createApp(data: CreateApplicationDto): Promise<BuilderAppResponse> {
    if (!data.credentials) {
      data.credentials = [];
    }
    if (!data.profiles) {
      data.profiles = [];
    }
    return this.makeRequest('POST', '/builder/apps', {
      ...data,
      profiles: ['admin'],
      credentials: [],
    });
  }

  async updateApp(data: UpdateApplicationDto): Promise<BuilderAppResponse> {
    const { name, ...updateData } = data;
    return this.makeRequest('PUT', `/builder/apps/${name}`, {
      ...updateData,
      profiles: ['admin'],
      credentials: [],
    });
  }

  async getApp(name: string): Promise<BuilderAppResponse> {
    return this.makeRequest('GET', `/builder/apps/${name}`);
  }

  async deleteApp(name: string): Promise<void> {
    return this.makeRequest('POST', `/builder/apps/remove`, {
      names: [name],
    });
  }
}
