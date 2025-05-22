import {
  Controller,
  Get,
  Post,
  Query,
  Session,
  Res,
  UnauthorizedException,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { randomBytes } from 'crypto';
import { KeycloakService } from '../services/keycloak.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SessionData } from '../types/session';
import { AuthStatusResponseDto, TokenResponseDto } from '../dto/auth-response.dto';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '@/config/env/env.config';
import { KeycloakUserInfo } from '../types/keycloak';

@ApiTags('Authentication')
@Controller('auth/keycloak')
export class KeycloakController {
  private readonly logger = new Logger(KeycloakController.name);

  constructor(
    private readonly keycloakService: KeycloakService,
    private readonly configService: ConfigService<EnvConfig>,
  ) {}

  @Get('login')
  @ApiOperation({
    summary: 'Initiate Keycloak login flow',
    description:
      'Redirects the user to Keycloak login page with proper OAuth2 parameters. This endpoint starts the SSO authentication process.',
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description:
      'Redirects to Keycloak login page. The response will contain a Location header with the Keycloak authorization URL.',
  })
  public login(@Session() session: SessionData, @Res() res: Response): void {
    const state = randomBytes(32).toString('hex');
    session.state = state;
    const authUrl = this.keycloakService.getAuthorizationUrl(state);
    res.redirect(authUrl);
  }

  @Get('callback')
  @ApiOperation({
    summary: 'Handle Keycloak callback',
    description:
      'Processes the OAuth2 callback from Keycloak after successful authentication. This endpoint should be registered as the OAuth2 redirect URI in Keycloak.',
  })
  @ApiQuery({
    name: 'code',
    description: 'Authorization code from Keycloak',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'state',
    description: 'State parameter for CSRF protection, must match the state from login',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Authentication successful, redirects to dashboard with established session',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid state parameter or authentication failed',
  })
  public async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Session() session: SessionData,
    @Res() res: Response,
  ): Promise<void> {
    try {
      if (!session.state || session.state !== state) {
        throw new UnauthorizedException('Invalid state parameter');
      }

      const tokens = await this.keycloakService.exchangeCodeForTokens(code);
      session.accessToken = tokens.accessToken;
      session.refreshToken = tokens.refreshToken;
      session.idToken = tokens.idToken;

      // Extract user information from the ID token
      const userInfo = this.keycloakService.getAuthenticatedUserInfo(
        tokens.accessToken,
        tokens.idToken,
      );

      // Store userId (Keycloak sub) and userInfo in session
      session.userId = userInfo.sub;
      session.userInfo = userInfo;

      delete session.state;

      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      if (!frontendUrl) {
        throw new Error('FRONTEND_URL not configured');
      }

      return res.redirect(`${frontendUrl}`);
    } catch (error) {
      this.logger.error('Failed to handle Keycloak callback:', error);
      res.redirect('/auth/error');
    }
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Uses the refresh token to obtain a new access token when the current one expires.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens refreshed successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No refresh token available or refresh failed',
  })
  public async refresh(@Session() session: SessionData): Promise<TokenResponseDto> {
    try {
      if (!session.refreshToken) {
        throw new UnauthorizedException('No refresh token available');
      }

      const tokens = await this.keycloakService.refreshTokens(session.refreshToken);

      // Preserve existing userId and update the session
      const userId = session.userId;
      const prevUserInfo = session.userInfo;

      session.accessToken = tokens.accessToken;
      session.refreshToken = tokens.refreshToken;
      session.idToken = tokens.idToken;

      // Extract updated user information from the new ID token
      const userInfo = this.keycloakService.getAuthenticatedUserInfo(
        tokens.accessToken,
        tokens.idToken,
      );

      // Preserve userId or update it from the new tokens if available
      session.userId = userInfo.sub || userId;
      session.userInfo = userInfo || prevUserInfo;

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        idToken: tokens.idToken,
      };
    } catch (error) {
      this.logger.error('Failed to refresh tokens:', error);
      throw new UnauthorizedException('Failed to refresh tokens');
    }
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Logout user',
    description:
      'Logs out the user from both the application and Keycloak SSO. This will invalidate all sessions.',
  })
  @ApiQuery({
    name: 'redirect_uri',
    description: 'Optional URL to redirect to after logout',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description:
      'Successfully logged out, redirects to Keycloak logout page or specified redirect URI',
  })
  public logout(
    @Session() session: SessionData,
    @Res() res: Response,
    @Query('redirect_uri') redirectUri?: string,
  ): void {
    try {
      if (session.idToken) {
        const logoutUrl = this.keycloakService.getLogoutUrl(session.idToken, redirectUri);
        session.accessToken = undefined;
        session.refreshToken = undefined;
        session.idToken = undefined;
        session.userId = undefined;
        session.userInfo = undefined;
        res.redirect(logoutUrl);
      } else {
        session.accessToken = undefined;
        session.refreshToken = undefined;
        session.idToken = undefined;
        session.userId = undefined;
        session.userInfo = undefined;
        res.redirect(redirectUri || '/');
      }
    } catch (error) {
      this.logger.error('Failed to logout:', error);
      res.redirect('/auth/error');
    }
  }

  @Get('status')
  @ApiOperation({
    summary: 'Check authentication status',
    description: 'Returns whether the user is currently authenticated based on session state.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns authentication status',
    type: AuthStatusResponseDto,
  })
  public getStatus(@Session() session: SessionData): AuthStatusResponseDto {
    const authenticated = !!session.accessToken;
    const user: KeycloakUserInfo = this.keycloakService.getAuthenticatedUserInfo(
      session.accessToken,
      session.idToken,
    );
    const userId = session.userId || user?.sub;

    return { authenticated, userId, user };
  }
}
