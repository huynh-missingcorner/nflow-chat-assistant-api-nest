export interface KeycloakTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  id_token: string;
  session_state: string;
  scope: string;
}

export interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  tokenType: string;
  scope: string;
}

export interface KeycloakErrorResponse {
  error: string;
  error_description: string;
}

export interface KeycloakUserInfo {
  sub?: string;
  name?: string;
  email?: string;
  preferred_username?: string;
}
