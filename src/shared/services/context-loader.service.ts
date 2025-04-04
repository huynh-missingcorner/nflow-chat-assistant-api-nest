import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class ContextLoaderService {
  private readonly logger = new Logger(ContextLoaderService.name);
  private contextCache: Map<string, string> = new Map();

  /**
   * Load context from a markdown file
   * @param agentPath Path to the agent's directory
   * @returns Context content as string
   */
  async loadContext(agentPath: string): Promise<string> {
    try {
      const cacheKey = agentPath;
      if (this.contextCache.has(cacheKey)) {
        return this.contextCache.get(cacheKey)!;
      }

      const contextPath = path.join(process.cwd(), agentPath, 'context.md');
      const content = await fs.readFile(contextPath, 'utf-8');

      // Cache the content
      this.contextCache.set(cacheKey, content);

      return content;
    } catch (error) {
      this.logger.error(`Failed to load context for ${agentPath}`, error);
      throw new Error(
        `Failed to load agent context: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
