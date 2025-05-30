import { Session } from 'express-session';

import { KeycloakUserInfo } from './keycloak';

export interface SessionData extends Session {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  state?: string;
  userId?: string;
  userInfo?: KeycloakUserInfo;
  id: string; // Session ID used for storage and retrieval
}

export interface UserInfo {
  username?: string;
  email?: string;
  roles?: string[];
}
