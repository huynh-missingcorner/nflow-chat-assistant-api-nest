import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CreateAppRequest, UpdateAppRequest } from '../types/api.types';
import { BaseNFlowService } from './base.service';

@Injectable()
export class NFlowApplicationService extends BaseNFlowService {
  constructor(httpService: HttpService, configService: ConfigService) {
    super(httpService, configService, NFlowApplicationService.name);
  }

  async createApp(data: CreateAppRequest) {
    return this.makeRequest('POST', '/builder/apps', {
      ...data,
      profiles: ['admin'],
      credentials: [],
    });
  }

  async updateApp(data: UpdateAppRequest) {
    const { name, ...updateData } = data;
    return this.makeRequest('PATCH', `/builder/apps/${name}`, {
      ...updateData,
      profiles: ['admin'],
      credentials: [],
    });
  }
}
