import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

import { getAgentContextPath } from '../constants/agent-paths.constants';

export interface ContextFile {
  name: string;
  content: string;
}

@Injectable()
export class ContextLoaderService {
  private readonly logger = new Logger(ContextLoaderService.name);
  private contextCache: Map<string, string | ContextFile[]> = new Map();

  /**
   * Load context from a markdown file
   * @param agentPath Path to the agent's directory relative to src
   * @returns Context content as string
   */
  async loadContext(agentPath: string): Promise<string> {
    try {
      const cacheKey = agentPath;
      const cached = this.contextCache.get(cacheKey);
      if (cached && typeof cached === 'string') {
        return cached;
      }

      const contextPath = path.join(process.cwd(), getAgentContextPath(agentPath));
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

  /**
   * Load all context files from a directory
   * @param directoryPath Path to the directory relative to src
   * @returns Array of context files with their content
   */
  async loadContextDirectory(directoryPath: string): Promise<ContextFile[]> {
    try {
      const cacheKey = directoryPath;
      const cached = this.contextCache.get(cacheKey);
      if (cached && Array.isArray(cached)) {
        return cached;
      }

      const fullPath = path.join(process.cwd(), 'src', directoryPath);
      const files = await fs.readdir(fullPath);
      const markdownFiles = files.filter((file) => file.endsWith('.md'));

      const contextFiles = await Promise.all(
        markdownFiles.map(async (file): Promise<ContextFile> => {
          const filePath = path.join(fullPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          return {
            name: file,
            content,
          };
        }),
      );

      // Cache the content
      this.contextCache.set(cacheKey, contextFiles);

      return contextFiles;
    } catch (error) {
      this.logger.error(`Failed to load contexts from directory ${directoryPath}`, error);
      throw new Error(
        `Failed to load contexts from directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
