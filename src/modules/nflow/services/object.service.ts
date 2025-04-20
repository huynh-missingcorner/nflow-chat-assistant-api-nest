import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BaseNFlowService } from './base.service';
import { FieldDto, FieldResponse, ObjectResponse } from '../types';
import { ObjectDto } from '../types';

@Injectable()
export class NFlowObjectService extends BaseNFlowService {
  constructor(httpService: HttpService, configService: ConfigService) {
    super(httpService, configService, NFlowObjectService.name);
  }

  async getObject(name: string): Promise<ObjectResponse> {
    return this.makeRequest('GET', `/mo/${name}`);
  }

  // CUD operations for objects
  async changeObject(data: ObjectDto): Promise<ObjectResponse> {
    if (data.action === 'delete') {
      return this.makeRequest('POST', `/mo/remove`, {
        names: [data.name],
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { name, ...rest } = data; // name is not used
    return this.makeRequest('POST', '/mo', rest);
  }

  async getFieldsForObject(name: string): Promise<FieldResponse[]> {
    return this.makeRequest('GET', `/mo/${name}/fields`);
  }

  // CUD operations for fields
  async changeField(data: FieldDto): Promise<FieldResponse> {
    const { objName, ...rest } = data;
    return this.makeRequest('POST', `/mo/${objName}/fields`, rest);
  }
}
