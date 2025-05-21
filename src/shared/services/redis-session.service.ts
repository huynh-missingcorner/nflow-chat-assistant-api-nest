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
        maxAge: 0.5 * 60 * 60 * 1000, // 30 minutes
        sameSite: 'lax',
      },
    };
  }

  // Method to get Redis client for use in main.ts
  getRedisClient() {
    return this.redisService.getClient();
  }

  public async getAccessToken(chatSessionId: string): Promise<string | undefined> {
    try {
      const chatSession = await this.redisService.get<{ accessToken?: string }>(
        `${this.SESSION_PREFIX}${chatSessionId}`,
      );

      if (!chatSession?.accessToken) {
        throw new Error(`Session not found for chatSessionId ${chatSessionId}`);
      }

      return chatSession.accessToken;
    } catch {
      throw new Error(`Failed to get access token for session ${chatSessionId}`);
    }
  }
}
