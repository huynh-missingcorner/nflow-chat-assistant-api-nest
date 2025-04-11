import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CreateFlowRequest } from '../types/api.types';
import { BaseNFlowService } from './base.service';

@Injectable()
export class NFlowFlowService extends BaseNFlowService {
  constructor(httpService: HttpService, configService: ConfigService) {
    super(httpService, configService, NFlowFlowService.name);
  }

  async createFlow(data: CreateFlowRequest) {
    return this.makeRequest('POST', '/flows', data);
  }
}
