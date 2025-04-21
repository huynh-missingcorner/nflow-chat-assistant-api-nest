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
    if (data.action === 'delete') {
      return this.makeRequest('POST', `/mo/${data.objName}/fields`, {
        action: 'delete',
        name: data.name ?? data.data.name,
      });
    }

    const { objName, ...requestBody } = data;

    // Format the request body based on typeName
    if (requestBody.data && requestBody.data.typeName) {
      if (!requestBody.data.attributes) {
        requestBody.data.attributes = {};
      }
      switch (requestBody.data.typeName) {
        case 'text':
          // Ensure subType is one of: short, long, rich
          if (
            !requestBody.data.attributes?.subType ||
            !['short', 'long', 'rich'].includes(requestBody.data.attributes.subType)
          ) {
            requestBody.data.attributes.subType = 'short';
          }
          break;

        case 'numeric':
          // Ensure subType is one of: integer, float
          if (
            !requestBody.data.attributes.subType ||
            !['integer', 'float'].includes(requestBody.data.attributes.subType)
          ) {
            requestBody.data.attributes.subType = 'integer';
          }
          break;

        case 'pickList':
          // Ensure subType is one of: single, multiple
          if (
            !requestBody.data.attributes.subType ||
            !['single', 'multiple'].includes(requestBody.data.attributes.subType)
          ) {
            requestBody.data.attributes.subType = 'single';
          }
          // Ensure pickListId is set
          if (!requestBody.data.pickListId) {
            this.logger.warn(`Missing pickListId for pickList field: ${requestBody.data.name}`);
          }
          break;

        case 'dateTime':
          // Ensure subType is one of: date-time, date, time
          if (
            !requestBody.data.attributes.subType ||
            !['date-time', 'date', 'time'].includes(requestBody.data.attributes.subType)
          ) {
            requestBody.data.attributes.subType = 'date-time';
          }
          break;

        case 'relation':
          // Ensure onDelete attribute is set
          if (!requestBody.data.attributes.onDelete) {
            requestBody.data.attributes.onDelete = 'noAction';
          }
          // Ensure filters attribute is set
          if (!requestBody.data.attributes.filters) {
            requestBody.data.attributes.filters = [];
          }
          break;

        case 'boolean':
          requestBody.data.attributes = {};
          break;

        case 'json':
          // These types don't require specific formatting
          break;

        default:
          this.logger.warn(`Unknown field type: ${requestBody.data.typeName}`);
          break;
      }
    }

    return this.makeRequest('POST', `/mo/${objName}/fields`, requestBody);
  }
}
