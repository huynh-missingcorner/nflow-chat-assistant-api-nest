import { Session } from 'express-session';

export interface SessionData extends Session {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  state?: string;
  userInfo?: UserInfo;
}

export interface UserInfo {
  username?: string;
  email?: string;
  roles?: string[];
}

declare module 'express-session' {
  interface SessionData {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    state?: string;
    userInfo?: UserInfo;
  }
}
