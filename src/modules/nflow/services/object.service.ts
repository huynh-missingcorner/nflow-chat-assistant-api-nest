/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ChangeObjectRequest, ChangeFieldRequest } from '../types/api.types';

@Injectable()
export class NFlowObjectService {
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

  async changeObject(data: ChangeObjectRequest) {
    const { name, ...rest } = data;
    console.log(name, rest);
    rest.data.name = rest.data.name.toLocaleLowerCase();
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/mo`, rest, { headers: this.headers }),
    );
    return response.data;
  }

  async changeField(data: ChangeFieldRequest) {
    const { objName, ...rest } = data;
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/mo/${objName}/fields`, rest, {
        headers: this.headers,
      }),
    );
    return response.data;
  }
}
