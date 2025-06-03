import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { Pool } from 'pg';

export interface IPersistenceService {
  getCheckpointer(): PostgresSaver;
}

export interface PersistenceConfig {
  connectionString: string;
}

@Injectable()
export class PersistenceService implements IPersistenceService, OnModuleInit {
  private readonly logger = new Logger(PersistenceService.name);
  private readonly persistenceConfig: PersistenceConfig;
  private checkpointer: PostgresSaver;

  constructor(private readonly configService: ConfigService) {
    this.persistenceConfig = this.getPersistenceConfig();
  }

  async onModuleInit(): Promise<void> {
    this.checkpointer = await this.createCheckpointer();
  }

  getCheckpointer(): PostgresSaver {
    return this.checkpointer;
  }

  getPersistenceConfiguration(): PersistenceConfig {
    return this.persistenceConfig;
  }

  private getPersistenceConfig(): PersistenceConfig {
    const connectionString = this.configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error('DATABASE_URL is required for PostgreSQL persistence');
    }

    return { connectionString };
  }

  private async createCheckpointer(): Promise<PostgresSaver> {
    const pool = new Pool({
      connectionString: this.persistenceConfig.connectionString,
    });

    this.logger.log('Initializing PostgresSaver checkpointer');
    const checkpointer = new PostgresSaver(pool);
    await checkpointer.setup();
    return checkpointer;
  }
}
