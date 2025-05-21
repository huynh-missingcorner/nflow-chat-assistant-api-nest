import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { TokenValidationService } from '../services/token-validation.service';
import { SessionSocket } from 'src/shared/socket/types';

@Injectable()
export class WsKeycloakAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsKeycloakAuthGuard.name);

  constructor(private readonly tokenValidationService: TokenValidationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: SessionSocket = context.switchToWs().getClient<SessionSocket>();
      const session = client.request.session;

      if (!session || !session.accessToken) {
        this.logger.warn('No valid session or access token found for WebSocket connection');
        throw new WsException('Unauthorized - No valid session');
      }

      // Validate the token using the same validation service that's used for HTTP
      await this.tokenValidationService.validateAccessToken(session.accessToken);

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`WebSocket authentication failed: ${message}`);
      throw new WsException('Unauthorized');
    }
  }
}
