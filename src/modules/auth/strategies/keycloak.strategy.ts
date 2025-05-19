import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { SessionData } from '../types/session';
import { TokenValidationService } from '../services/token-validation.service';

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'keycloak') {
  constructor(private readonly tokenValidationService: TokenValidationService) {
    super();
  }

  async validate(
    req: Request & { session: SessionData },
  ): Promise<{ authenticated: boolean; userInfo?: any }> {
    if (!req.session?.accessToken) {
      throw new UnauthorizedException('No valid session found');
    }

    const tokenInfo = await this.tokenValidationService.validateAccessToken(
      req.session.accessToken,
    );

    return {
      authenticated: true,
      userInfo: {
        username: tokenInfo.username,
        email: tokenInfo.email,
      },
    };
  }
}
