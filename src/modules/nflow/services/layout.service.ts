/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CreateLayoutRequest } from '../types/api.types';

@Injectable()
export class NFlowLayoutService {
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

  async createLayout(data: CreateLayoutRequest) {
    const response = await firstValueFrom(
      this.httpService.post('/builder/layouts', data, { headers: this.headers }),
    );
    return response.data;
  }
}
