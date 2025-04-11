import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError, AxiosRequestConfig } from 'axios';

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  idToken: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
}

@Injectable()
export class BaseNFlowService {
  protected readonly baseUrl: string;
  protected readonly logger: Logger;

  constructor(
    protected readonly httpService: HttpService,
    protected readonly configService: ConfigService,
    serviceName: string,
  ) {
    this.baseUrl = this.configService.getOrThrow<string>('NFLOW_API_URL');
    this.logger = new Logger(serviceName);
  }

  protected async refreshToken(): Promise<TokenResponse> {
    const refreshToken = this.configService.get<string>('NFLOW_REFRESH_TOKEN');
    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<AuthResponse>(
          `${this.configService.get('NFLOW_API_URL')}/auth/token`,
          {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: this.configService.get<string>('NFLOW_CLIENT_ID'),
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        idToken: response.data.id_token,
      };
    } catch (error) {
      this.logger.error('Failed to refresh token', error);
      throw new Error('Failed to refresh authentication token');
    }
  }

  protected get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.configService.getOrThrow<string>('NFLOW_API_KEY')}`,
      'Content-Type': 'application/json',
    };
  }

  protected async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: unknown,
    config: AxiosRequestConfig = {},
  ): Promise<T> {
    try {
      const requestConfig = {
        ...config,
        headers: this.headers,
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
          const newTokens = await this.refreshToken();
          // Update the token in config or environment
          // Retry the request with new token
          const retryConfig = {
            ...config,
            headers: {
              ...this.headers,
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
          this.logger.error('Failed to refresh token and retry request', refreshError);
          throw refreshError;
        }
      }

      throw error;
    }
  }
}
