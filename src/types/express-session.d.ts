import 'express-session';
import { UserInfo } from '../modules/auth/types/session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    state?: string;
    userInfo?: UserInfo;
  }
}
