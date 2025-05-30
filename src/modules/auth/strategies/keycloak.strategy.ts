import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';

import { TokenValidationService } from '../services/token-validation.service';
import { SessionData } from '../types/session';

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
