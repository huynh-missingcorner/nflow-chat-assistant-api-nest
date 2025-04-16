import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BaseNFlowService } from './base.service';
import { CreateLayoutDto, LayoutResponse } from '../types';
@Injectable()
export class NFlowLayoutService extends BaseNFlowService {
  constructor(httpService: HttpService, configService: ConfigService) {
    super(httpService, configService, NFlowLayoutService.name);
  }

  async createLayout(data: CreateLayoutDto): Promise<LayoutResponse> {
    return this.makeRequest('POST', '/builder/layouts', data);
  }
}
