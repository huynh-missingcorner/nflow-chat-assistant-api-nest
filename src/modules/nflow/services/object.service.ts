import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ChangeObjectRequest, ChangeFieldRequest } from '../types/api.types';
import { BaseNFlowService } from './base.service';

@Injectable()
export class NFlowObjectService extends BaseNFlowService {
  constructor(httpService: HttpService, configService: ConfigService) {
    super(httpService, configService, NFlowObjectService.name);
  }

  async changeObject(data: ChangeObjectRequest) {
    const { name, ...rest } = data;
    console.log(name, rest);
    rest.data.recordName.label = 'Name';
    rest.data.name = rest.data.name.toLowerCase();
    return this.makeRequest('POST', '/mo', rest);
  }

  async changeField(data: ChangeFieldRequest) {
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
