import { ApiProperty } from '@nestjs/swagger';

export class AuthStatusResponseDto {
  @ApiProperty({
    description: 'Whether the user is currently authenticated',
    example: true,
  })
  authenticated: boolean;
}

export class TokenResponseDto {
  @ApiProperty({
    description: 'Access token for API calls',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token used to refresh the access token',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'OpenID Connect ID token containing user information',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  idToken: string;
}
