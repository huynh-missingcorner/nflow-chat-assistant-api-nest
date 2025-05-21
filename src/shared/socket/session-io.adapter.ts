import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { Server } from 'socket.io';
import type { Request, Response } from 'express';

export interface SessionMiddleware {
  (req: Request, res: Response, next: (err?: any) => any): void;
}

export class SessionIoAdapter extends IoAdapter {
  constructor(
    private app: INestApplication,
    private sessionMiddleware: SessionMiddleware,
  ) {
    super(app);
  }

  create(port: number, options?: ServerOptions): any {
    const server: Server = super.create(port, options);

    server.engine.use((req: Request, res: Response, next: (err?: any) => void) => {
      // Handle session middleware promise rejections
      const originalNext = next;
      const wrappedNext = (err?: any) => {
        if (err) {
          console.error('Session middleware error:', err);
        }
        originalNext(err);
      };

      // Apply the session middleware with wrapped next function
      this.sessionMiddleware(req, res, wrappedNext);
    });

    return server;
  }
}
