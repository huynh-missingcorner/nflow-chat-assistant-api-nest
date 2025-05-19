export interface KeycloakTokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
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
  error_description?: string;
}
