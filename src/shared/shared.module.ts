import { Global, Module } from '@nestjs/common';

import { ContextLoaderService } from './services/context-loader.service';
import { RedisSessionService } from './services/redis-session.service';

@Global()
@Module({
  providers: [ContextLoaderService, RedisSessionService],
  exports: [ContextLoaderService, RedisSessionService],
})
export class SharedModule {}
