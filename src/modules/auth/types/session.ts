import { Session } from 'express-session';
import { KeycloakUserInfo } from './keycloak';

export interface SessionData extends Session {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  state?: string;
  userId?: string;
  userInfo?: KeycloakUserInfo;
}

export interface UserInfo {
  username?: string;
  email?: string;
  roles?: string[];
}
