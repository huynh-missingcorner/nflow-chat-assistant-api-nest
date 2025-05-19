import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';
import { KeycloakService } from './services/keycloak.service';
import { TokenValidationService } from './services/token-validation.service';
import { KeycloakStrategy } from './strategies/keycloak.strategy';
import { KeycloakController } from './controllers/keycloak.controller';

@Module({
  imports: [HttpModule, PassportModule.register({ session: true })],
  providers: [KeycloakService, TokenValidationService, KeycloakStrategy],
  exports: [KeycloakService, TokenValidationService],
  controllers: [KeycloakController],
})
export class AuthModule {}
