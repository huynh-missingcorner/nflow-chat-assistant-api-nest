import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BaseNFlowService } from './base.service';
import { FlowCreateDto, FlowResponse } from '../types';

@Injectable()
export class NFlowFlowService extends BaseNFlowService {
  constructor(httpService: HttpService, configService: ConfigService) {
    super(httpService, configService, NFlowFlowService.name);
  }

  async createFlow(data: FlowCreateDto): Promise<FlowResponse> {
    return this.makeRequest('POST', '/flows', data);
  }
}
