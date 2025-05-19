import { Session } from 'express-session';

export interface SessionData extends Session {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  state?: string;
  userInfo?: {
    username?: string;
    email?: string;
    roles?: string[];
  };
}

declare module 'express-session' {
  interface SessionData {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    state?: string;
    userInfo?: {
      username?: string;
      email?: string;
      roles?: string[];
    };
  }
}
