/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CreateAppRequest, UpdateAppRequest } from '../types/api.types';

@Injectable()
export class NFlowApplicationService {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.getOrThrow<string>('NFLOW_API_URL');
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.configService.getOrThrow('NFLOW_API_KEY')}`,
      'Content-Type': 'application/json',
    };
  }

  async createApp(data: CreateAppRequest) {
    const response = await firstValueFrom(
      this.httpService.post('/builder/apps', data, { headers: this.headers }),
    );
    return response.data;
  }

  async updateApp(data: UpdateAppRequest) {
    const { name, ...updateData } = data;
    const response = await firstValueFrom(
      this.httpService.patch(`/builder/apps/${name}`, updateData, { headers: this.headers }),
    );
    return response.data;
  }
}
