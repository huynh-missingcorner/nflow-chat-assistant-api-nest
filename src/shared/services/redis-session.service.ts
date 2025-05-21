import { Injectable } from '@nestjs/common';
import { RedisService } from '../infrastructure/redis/redis.service';
import { SessionOptions } from 'express-session';
import { RedisStore } from 'connect-redis';

@Injectable()
export class RedisSessionService {
  private readonly SESSION_PREFIX = 'sess:';

  constructor(private readonly redisService: RedisService) {}

  getSessionConfig(): SessionOptions {
    const redisStore = new RedisStore({
      client: this.redisService.getClient(),
      prefix: this.SESSION_PREFIX,
    });

    return {
      store: redisStore,
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax',
      },
    };
  }

  // Method to get Redis client for use in main.ts
  getRedisClient() {
    return this.redisService.getClient();
  }

  public async getAccessToken(sessionId: string): Promise<string | undefined> {
    try {
      const session = await this.redisService.get<{ accessToken?: string }>(
        `${this.SESSION_PREFIX}${sessionId}`,
      );

      if (!session?.accessToken) {
        throw new Error(`Session not found for sessionId ${sessionId}`);
      }

      return session.accessToken;
    } catch {
      throw new Error(`Failed to get access token for session ${sessionId}`);
    }
  }
}
