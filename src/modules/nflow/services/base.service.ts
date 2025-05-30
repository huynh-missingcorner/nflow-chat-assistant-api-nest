import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';

import { KeycloakService } from '@/modules/auth/services/keycloak.service';
import { RedisSessionService } from '@/shared/services/redis-session.service';

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  idToken: string;
}

@Injectable()
export class BaseNFlowService {
  protected readonly baseUrl: string;
  protected readonly logger: Logger;

  constructor(
    protected readonly httpService: HttpService,
    protected readonly configService: ConfigService,
    protected readonly redisSessionService: RedisSessionService,
    protected readonly keycloakService: KeycloakService,
    serviceName: string,
  ) {
    this.baseUrl = this.configService.getOrThrow<string>('NFLOW_API_URL');
    this.logger = new Logger(serviceName);
  }

  /**
   * Refresh a user's Keycloak token
   * @param userId The ID of the user
   * @returns The new tokens
   */
  protected async refreshUserToken(userId: string): Promise<TokenResponse> {
    const userSession = await this.redisSessionService.getUserSession(userId);

    if (!userSession || !userSession.refreshToken) {
      throw new UnauthorizedException('User refresh token not found');
    }

    try {
      // Use KeycloakService to refresh the token
      const newTokens = await this.keycloakService.refreshTokens(userSession.refreshToken);

      // Update the session with new tokens
      await this.redisSessionService.setUserSession(userId, {
        ...userSession,
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        idToken: newTokens.idToken,
      });

      return {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        idToken: newTokens.idToken,
      };
    } catch (error) {
      this.logger.error(`Failed to refresh token for user ${userId}`, error);
      throw new UnauthorizedException('Failed to refresh authentication token');
    }
  }

  /**
   * Get headers for the request including the user's access token
   * @param userId The ID of the user
   * @returns Headers with Authorization using the user's access token
   */
  protected async getUserHeaders(userId: string): Promise<Record<string, string>> {
    if (!userId) {
      throw new UnauthorizedException('User ID is required for API access');
    }

    const userSession = await this.redisSessionService.getUserSession(userId);

    if (!userSession || !userSession.accessToken) {
      throw new UnauthorizedException('User access token not found');
    }

    return {
      Authorization: `Bearer ${userSession.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Make a request to the NFlow API with user-specific authentication
   * @param method HTTP method
   * @param endpoint API endpoint
   * @param data Optional request data
   * @param config Optional Axios config
   * @param userId The ID of the user making the request
   * @returns The API response
   */
  protected async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: unknown,
    config: AxiosRequestConfig = {},
    userId?: string,
  ): Promise<T> {
    if (!userId) {
      throw new UnauthorizedException('User ID is required for NFlow API access');
    }

    try {
      const requestConfig = {
        ...config,
        headers: await this.getUserHeaders(userId),
      };

      const response = await firstValueFrom(
        this.httpService.request<T>({
          method,
          url: `${this.baseUrl}${endpoint}`,
          data,
          ...requestConfig,
        }),
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        // Token expired, try to refresh and retry request
        try {
          const newTokens = await this.refreshUserToken(userId);

          // Get fresh headers but override with the new token
          const headers = await this.getUserHeaders(userId);

          const retryConfig = {
            ...config,
            headers: {
              ...headers,
              Authorization: `Bearer ${newTokens.accessToken}`,
            },
          };

          const retryResponse = await firstValueFrom(
            this.httpService.request<T>({
              method,
              url: `${this.baseUrl}${endpoint}`,
              data,
              ...retryConfig,
            }),
          );

          return retryResponse.data;
        } catch (refreshError) {
          this.logger.error(
            `Failed to refresh token and retry request for user ${userId}`,
            refreshError,
          );
          throw refreshError;
        }
      }

      throw error;
    }
  }
}
