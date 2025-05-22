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
    description: 'User ID from Keycloak (sub claim)',
    required: false,
    example: '12345-67890-abcdef',
  })
  userId?: string;

  @ApiProperty({
    description: 'User information from the ID token',
    properties: {
      sub: { type: 'string', example: '12345-67890-abcdef' },
      email: { type: 'string', example: 'user@example.com' },
      name: { type: 'string', example: 'John Doe' },
      preferred_username: { type: 'string', example: 'johndoe' },
    },
    type: 'object',
    additionalProperties: true,
  })
  user: KeycloakUserInfo;
}
