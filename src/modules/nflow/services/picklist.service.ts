import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { KeycloakService } from '@/modules/auth/services/keycloak.service';
import { RedisSessionService } from '@/shared/services/redis-session.service';

import { NFLOW_API_ENDPOINTS } from '../constants/api-endpoints';
import {
  AuditLogCollection,
  AuditLogQueryParams,
  CreatePickListDto,
  PickListCollection,
  PickListQueryParams,
  PickListResponse,
  RecoverPickListDto,
  RemovePickListDto,
  UpdatePickListDto,
} from '../types';
import { BaseNFlowService } from './base.service';

@Injectable()
export class NflowPicklistService extends BaseNFlowService {
  constructor(
    httpService: HttpService,
    configService: ConfigService,
    redisSessionService: RedisSessionService,
    keycloakService: KeycloakService,
  ) {
    super(
      httpService,
      configService,
      redisSessionService,
      keycloakService,
      NflowPicklistService.name,
    );
  }

  /**
   * Get pick list by name
   * @param name The name of the pick list
   * @param userId The ID of the user making the request
   * @returns The pick list details
   */
  async getPickList(name: string, userId: string): Promise<PickListResponse> {
    return this.get(NFLOW_API_ENDPOINTS.PICK_LISTS.GET_PICK_LIST(name), userId);
  }

  /**
   * Update pick list by name
   * @param name The name of the pick list to update
   * @param data The update data
   * @param userId The ID of the user making the request
   * @returns The updated pick list
   */
  async updatePickList(
    name: string,
    data: UpdatePickListDto,
    userId: string,
  ): Promise<PickListResponse> {
    return this.put(NFLOW_API_ENDPOINTS.PICK_LISTS.UPDATE_PICK_LIST(name), userId, data);
  }

  /**
   * Search and retrieve pick lists with filtering and pagination
   * @param queryParams Query parameters for search and filtering
   * @param userId The ID of the user making the request
   * @returns Paginated collection of pick lists
   */
  async searchPickLists(
    queryParams: PickListQueryParams,
    userId: string,
  ): Promise<PickListCollection> {
    return this.post(NFLOW_API_ENDPOINTS.PICK_LISTS.SEARCH_PICK_LISTS, userId, queryParams);
  }

  /**
   * Create a new pick list
   * @param data The pick list creation data
   * @param userId The ID of the user making the request
   * @returns The created pick list
   */
  async createPickList(data: CreatePickListDto, userId: string): Promise<PickListResponse> {
    return this.post(NFLOW_API_ENDPOINTS.PICK_LISTS.CREATE_PICK_LIST, userId, data);
  }

  /**
   * Activate a pick list
   * @param name The name of the pick list to activate
   * @param userId The ID of the user making the request
   * @returns The activated pick list
   */
  async activatePickList(name: string, userId: string): Promise<PickListResponse> {
    return this.put(NFLOW_API_ENDPOINTS.PICK_LISTS.ACTIVATE_PICK_LIST(name), userId);
  }

  /**
   * Deactivate a pick list
   * @param name The name of the pick list to deactivate
   * @param userId The ID of the user making the request
   * @returns The deactivated pick list
   */
  async deactivatePickList(name: string, userId: string): Promise<PickListResponse> {
    return this.put(NFLOW_API_ENDPOINTS.PICK_LISTS.DEACTIVATE_PICK_LIST(name), userId);
  }

  /**
   * Get audit logs for a pick list
   * @param name The name of the pick list
   * @param queryParams Query parameters for audit log filtering
   * @param userId The ID of the user making the request
   * @returns Paginated collection of audit logs
   */
  async getPickListAuditLogs(
    name: string,
    queryParams: AuditLogQueryParams,
    userId: string,
  ): Promise<AuditLogCollection> {
    return this.get(NFLOW_API_ENDPOINTS.PICK_LISTS.GET_AUDIT_LOGS(name), userId, {
      params: queryParams,
    });
  }

  /**
   * Remove (soft delete) pick lists
   * @param data The data containing names of pick lists to remove
   * @param userId The ID of the user making the request
   * @returns Success response
   */
  async removePickLists(data: RemovePickListDto, userId: string): Promise<void> {
    return this.post(NFLOW_API_ENDPOINTS.PICK_LISTS.REMOVE_PICK_LISTS, userId, data);
  }

  /**
   * Recover (restore) pick lists
   * @param data The data containing names of pick lists to recover
   * @param userId The ID of the user making the request
   * @returns Success response
   */
  async recoverPickLists(data: RecoverPickListDto, userId: string): Promise<void> {
    return this.post(NFLOW_API_ENDPOINTS.PICK_LISTS.RECOVER_PICK_LISTS, userId, data);
  }

  // Convenience methods for common operations

  /**
   * Get all active pick lists
   * @param userId The ID of the user making the request
   * @param limit Optional limit for pagination
   * @param offset Optional offset for pagination
   * @returns Paginated collection of active pick lists
   */
  async getActivePickLists(userId: string, limit = 20, offset = 0): Promise<PickListCollection> {
    const queryParams: PickListQueryParams = {
      status: 'ACTIVE',
      limit,
      offset,
      sortBy: 'displayName',
      sortOrder: 'ASC',
    };
    return this.searchPickLists(queryParams, userId);
  }

  /**
   * Get all inactive pick lists
   * @param userId The ID of the user making the request
   * @param limit Optional limit for pagination
   * @param offset Optional offset for pagination
   * @returns Paginated collection of inactive pick lists
   */
  async getInactivePickLists(userId: string, limit = 20, offset = 0): Promise<PickListCollection> {
    const queryParams: PickListQueryParams = {
      status: 'INACTIVE',
      limit,
      offset,
      sortBy: 'displayName',
      sortOrder: 'ASC',
    };
    return this.searchPickLists(queryParams, userId);
  }

  /**
   * Search pick lists by text
   * @param searchText The text to search for
   * @param userId The ID of the user making the request
   * @param limit Optional limit for pagination
   * @param offset Optional offset for pagination
   * @returns Paginated collection of matching pick lists
   */
  async searchPickListsByText(
    searchText: string,
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<PickListCollection> {
    const queryParams: PickListQueryParams = {
      searchText,
      limit,
      offset,
      sortBy: 'displayName',
      sortOrder: 'ASC',
    };
    return this.searchPickLists(queryParams, userId);
  }

  /**
   * Get pick lists by tags
   * @param tagNames Array of tag names to filter by
   * @param userId The ID of the user making the request
   * @param limit Optional limit for pagination
   * @param offset Optional offset for pagination
   * @returns Paginated collection of pick lists with matching tags
   */
  async getPickListsByTags(
    tagNames: string[],
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<PickListCollection> {
    const queryParams: PickListQueryParams = {
      tagNames,
      limit,
      offset,
      sortBy: 'displayName',
      sortOrder: 'ASC',
    };
    return this.searchPickLists(queryParams, userId);
  }
}
