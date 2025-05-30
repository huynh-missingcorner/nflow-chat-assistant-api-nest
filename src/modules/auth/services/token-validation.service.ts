import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { EnvConfig } from '../../../config/env/env.config';

interface TokenIntrospectionResponse {
  active: boolean;
  exp?: number;
  username?: string;
  email?: string;
  scope?: string;
}

@Injectable()
export class TokenValidationService {
  private readonly logger = new Logger(TokenValidationService.name);
  private readonly keycloakConfig: {
    clientId: string;
    clientSecret: string;
    realm: string;
    authServerUrl: string;
  };

  constructor(
    private readonly configService: ConfigService<EnvConfig>,
    private readonly httpService: HttpService,
  ) {
    this.keycloakConfig = {
      clientId: this.configService.get('KEYCLOAK_CLIENT_ID')!,
      clientSecret: this.configService.get('KEYCLOAK_CLIENT_SECRET')!,
      realm: this.configService.get('KEYCLOAK_REALM')!,
      authServerUrl: this.configService.get('KEYCLOAK_AUTH_SERVER_URL')!,
    };
  }

  /**
   * Validate an access token using Keycloak's token introspection endpoint
   */
  public async validateAccessToken(accessToken: string): Promise<TokenIntrospectionResponse> {
    const params = new URLSearchParams({
      token: accessToken,
      client_id: this.keycloakConfig.clientId,
      client_secret: this.keycloakConfig.clientSecret,
    });

    try {
      const response = await firstValueFrom(
        this.httpService.post<TokenIntrospectionResponse>(
          `${this.keycloakConfig.authServerUrl}/realms/${this.keycloakConfig.realm}/protocol/openid-connect/token/introspect`,
          params.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      if (!response.data.active) {
        throw new UnauthorizedException('Token is not active');
      }

      return response.data;
    } catch (error: unknown) {
      this.logger.error(
        `Token validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new UnauthorizedException('Failed to validate token');
    }
  }
}
