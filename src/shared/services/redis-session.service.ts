import { Injectable, Logger } from '@nestjs/common';
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
  private readonly USER_SESSION_MAP_PREFIX = 'user-session-map:';
  private readonly logger = new Logger(RedisSessionService.name);

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
   * Maps a userId to a sessionId in Redis
   * @param userId The user ID to map
   * @param sessionId The session ID to associate with the user
   */
  public async mapUserToSession(userId: string, sessionId: string): Promise<void> {
    try {
      await this.redisService.set(`${this.USER_SESSION_MAP_PREFIX}${userId}`, sessionId);
      this.logger.debug(`Mapped user ${userId} to session ${sessionId}`);
    } catch (error: unknown) {
      this.logger.error(`Failed to map user ${userId} to session ${sessionId}`, error);
      throw new Error(
        `Failed to map user to session: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Gets the sessionId associated with a userId
   * @param userId The user ID to look up
   * @returns The associated session ID or null if not found
   */
  public async getSessionIdForUser(userId: string): Promise<string | null> {
    try {
      return await this.redisService.get<string>(`${this.USER_SESSION_MAP_PREFIX}${userId}`);
    } catch (error: unknown) {
      this.logger.error(`Failed to get session ID for user ${userId}`, error);
      return null;
    }
  }

  /**
   * Get a user session by userId
   * @param userId The ID of the user
   * @returns The user session data or null if not found
   */
  public async getUserSession(userId: string): Promise<UserSessionData | null> {
    try {
      const sessionId = await this.getSessionIdForUser(userId);

      if (!sessionId) {
        this.logger.warn(`No session ID found for user ${userId}`);
        return null;
      }

      const sessionData = await this.redisService.get<UserSessionData>(
        `${this.SESSION_PREFIX}${sessionId}`,
      );

      if (!sessionData) {
        this.logger.warn(`Session data not found for session ID ${sessionId}`);
        return null;
      }

      return sessionData;
    } catch (error: unknown) {
      this.logger.error(`Error retrieving user session for ${userId}`, error);
      return null;
    }
  }

  /**
   * Update a user session by userId
   * @param userId The ID of the user
   * @param sessionData The session data to store
   * @param ttlSeconds Time to live in seconds (optional)
   */
  public async setUserSession(
    userId: string,
    sessionData: UserSessionData,
    ttlSeconds?: number,
  ): Promise<void> {
    try {
      const sessionId = await this.getSessionIdForUser(userId);

      if (!sessionId) {
        throw new Error(`No session ID found for user ${userId}`);
      }

      const key = `${this.SESSION_PREFIX}${sessionId}`;

      if (ttlSeconds) {
        await this.redisService.set(key, sessionData, ttlSeconds);
      } else {
        await this.redisService.set(key, sessionData);
      }

      this.logger.debug(`Updated session data for user ${userId} (session ${sessionId})`);
    } catch (error: unknown) {
      this.logger.error(`Failed to update session for user ${userId}`, error);
      throw new Error(
        `Failed to update user session: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
