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
    const { name, ...rest } = data;
    console.log(name, rest);
    rest.data.recordName.label = 'Name';
    rest.data.name = rest.data.name.toLowerCase();
    return this.makeRequest('POST', '/mo', rest);
  }

  async getFieldsForObject(name: string): Promise<FieldResponse[]> {
    return this.makeRequest('GET', `/mo/${name}/fields`);
  }

  // CUD operations for fields
  async changeField(data: FieldDto): Promise<FieldResponse> {
    const { objName, ...rest } = data;
    switch (rest.data.typeName) {
      case 'numeric':
        rest.data.attributes = {
          ...rest.data.attributes,
          subType: 'integer',
        };
        break;
      case 'text':
        rest.data.attributes = {
          ...rest.data.attributes,
          subType: 'short',
        };
        break;
      case 'dateTime':
        rest.data.attributes = {
          ...rest.data.attributes,
          subType: 'date-time',
        };
        break;
      default:
        break;
    }
    return this.makeRequest('POST', `/mo/${objName}/fields`, rest);
  }
}
