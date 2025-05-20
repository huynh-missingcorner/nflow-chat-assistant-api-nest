import { ApiProperty } from '@nestjs/swagger';
import { KeycloakUserInfo } from '../types/keycloak';

export class TokenResponseDto {
  @ApiProperty({
    description: 'The access token for API requests',
  })
  accessToken: string;

  @ApiProperty({
    description: 'The refresh token to get new access tokens',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'The ID token containing user information',
  })
  idToken: string;
}

export class AuthStatusResponseDto {
  @ApiProperty({
    description: 'Whether the user is currently authenticated',
  })
  authenticated: boolean;

  @ApiProperty({
    description: 'User information from the ID token',
    properties: {
      email: { type: 'string', example: 'user@example.com' },
      name: { type: 'string', example: 'John Doe' },
    },
    type: 'object',
    additionalProperties: true,
  })
  user: KeycloakUserInfo;
}
