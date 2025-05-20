import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { SessionData } from '../types/session';

@Injectable()
export class NflowAuthGuard implements CanActivate {
  private readonly logger = new Logger(NflowAuthGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const session = request.session as SessionData;

    if (!session.accessToken) {
      this.logger.warn('No access token found in session');
      throw new UnauthorizedException('No access token available. Please authenticate first.');
    }

    return true;
  }
}
