import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { EnvConfig } from '../../../config/env/env.config';
import { KeycloakTokenResponse, TokenInfo, KeycloakErrorResponse } from '../types/keycloak';

@Injectable()
export class KeycloakService {
  private readonly logger = new Logger(KeycloakService.name);
  private readonly keycloakConfig: {
    clientId: string;
    clientSecret: string;
    realm: string;
    authServerUrl: string;
    callbackUrl: string;
  };

  constructor(
    private readonly configService: ConfigService<EnvConfig>,
    private readonly httpService: HttpService,
  ) {
    // Non-null assertion is safe here because these values are required in env.config.ts
    this.keycloakConfig = {
      clientId: this.configService.get('KEYCLOAK_CLIENT_ID')!,
      clientSecret: this.configService.get('KEYCLOAK_CLIENT_SECRET')!,
      realm: this.configService.get('KEYCLOAK_REALM')!,
      authServerUrl: this.configService.get('KEYCLOAK_AUTH_SERVER_URL')!,
      callbackUrl: this.configService.get('KEYCLOAK_CALLBACK_URL')!,
    };
  }

  /**
   * Get the authorization URL for initiating the OAuth2 flow
   */
  public getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.keycloakConfig.clientId,
      response_type: 'code',
      scope: 'openid email profile',
      redirect_uri: this.keycloakConfig.callbackUrl,
      state,
    });

    return `${this.keycloakConfig.authServerUrl}/realms/${this.keycloakConfig.realm}/protocol/openid-connect/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  public async exchangeCodeForTokens(code: string): Promise<TokenInfo> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.keycloakConfig.clientId,
      client_secret: this.keycloakConfig.clientSecret,
      code,
      redirect_uri: this.keycloakConfig.callbackUrl,
    });

    try {
      const response = await firstValueFrom(
        this.httpService.post<KeycloakTokenResponse>(
          `${this.keycloakConfig.authServerUrl}/realms/${this.keycloakConfig.realm}/protocol/openid-connect/token`,
          params.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      return this.mapTokenResponse(response.data);
    } catch (error) {
      this.handleTokenError(error);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshTokens(refreshToken: string): Promise<TokenInfo> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.keycloakConfig.clientId,
      client_secret: this.keycloakConfig.clientSecret,
      refresh_token: refreshToken,
    });

    try {
      const response = await firstValueFrom(
        this.httpService.post<KeycloakTokenResponse>(
          `${this.keycloakConfig.authServerUrl}/realms/${this.keycloakConfig.realm}/protocol/openid-connect/token`,
          params.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      return this.mapTokenResponse(response.data);
    } catch (error) {
      this.handleTokenError(error);
    }
  }

  /**
   * Get the logout URL
   */
  public getLogoutUrl(idToken: string, redirectUri?: string): string {
    const params = new URLSearchParams({
      client_id: this.keycloakConfig.clientId,
      id_token_hint: idToken,
      ...(redirectUri && { post_logout_redirect_uri: redirectUri }),
    });

    return `${this.keycloakConfig.authServerUrl}/realms/${this.keycloakConfig.realm}/protocol/openid-connect/logout?${params.toString()}`;
  }

  /**
   * Map Keycloak token response to our internal TokenInfo type
   */
  private mapTokenResponse(response: KeycloakTokenResponse): TokenInfo {
    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      idToken: response.id_token,
      expiresIn: response.expires_in,
      refreshExpiresIn: response.refresh_expires_in,
      tokenType: response.token_type,
      scope: response.scope,
    };
  }

  /**
   * Handle token-related errors
   */
  private handleTokenError(error: unknown): never {
    if (error instanceof AxiosError) {
      const errorResponse = error.response?.data as KeycloakErrorResponse | undefined;
      this.logger.error(
        `Keycloak token error: ${errorResponse?.error_description || error.message}`,
      );
      throw new UnauthorizedException('Failed to authenticate with Keycloak');
    }
    throw error;
  }
}
