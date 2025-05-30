import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { RedisSessionService } from 'src/shared/services/redis-session.service';

import { KeycloakController } from './controllers/keycloak.controller';
import { KeycloakService } from './services/keycloak.service';
import { TokenValidationService } from './services/token-validation.service';
import { KeycloakStrategy } from './strategies/keycloak.strategy';

@Module({
  imports: [HttpModule, PassportModule.register({ session: true })],
  providers: [KeycloakService, TokenValidationService, KeycloakStrategy, RedisSessionService],
  exports: [KeycloakService, TokenValidationService],
  controllers: [KeycloakController],
})
export class AuthModule {}
