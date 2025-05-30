import { IncomingMessage } from 'http';

import { Request } from 'express';
import { Socket } from 'socket.io';
import { SessionData } from 'src/modules/auth/types/session';

/**
 * Extends the HTTP IncomingMessage with session data
 */
export interface SessionIncomingMessage extends IncomingMessage {
  session: SessionData;
}

/**
 * Extends the Socket.io Socket with session data on the request
 */
export interface SessionSocket extends Socket {
  request: Request & {
    session: SessionData;
  };
  data: {
    user?: {
      userId: string;
    };
    [key: string]: any;
  };
}
