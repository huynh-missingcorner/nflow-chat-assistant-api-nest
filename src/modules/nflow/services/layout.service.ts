import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CreateLayoutRequest } from '../types/api.types';
import { BaseNFlowService } from './base.service';

@Injectable()
export class NFlowLayoutService extends BaseNFlowService {
  constructor(httpService: HttpService, configService: ConfigService) {
    super(httpService, configService, NFlowLayoutService.name);
  }

  async createLayout(data: CreateLayoutRequest) {
    return this.makeRequest('POST', '/builder/layouts', data);
  }
}
