import { Injectable } from '@nestjs/common';
import { RedisService } from '../infrastructure/redis/redis.service';
import { SessionOptions } from 'express-session';
import { RedisStore } from 'connect-redis';
import { KeycloakUserInfo } from 'src/modules/auth/types/keycloak';

export interface UserSessionData {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  state?: string;
  userId?: string;
  userInfo?: KeycloakUserInfo;
}

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

  /**
   * Get a user session by userId
   * @param userId The ID of the user
   * @returns The user session data or null if not found
   */
  public async getUserSession(userId: string): Promise<UserSessionData | null> {
    try {
      return await this.redisService.get<UserSessionData>(`${this.SESSION_PREFIX}${userId}`);
    } catch {
      return null;
    }
  }

  /**
   * Update or create a user session
   * @param userId The ID of the user
   * @param sessionData The session data to store
   * @param ttlSeconds Time to live in seconds (optional)
   */
  public async setUserSession(
    userId: string,
    sessionData: UserSessionData,
    ttlSeconds?: number,
  ): Promise<void> {
    const key = `${this.SESSION_PREFIX}${userId}`;

    if (ttlSeconds) {
      await this.redisService.set(key, sessionData, ttlSeconds);
    } else {
      await this.redisService.set(key, sessionData);
    }
  }
}
