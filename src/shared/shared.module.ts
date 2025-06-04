import { Global, Module } from '@nestjs/common';

import { BaseGraphHandlerService } from './graph/handlers/base-graph-handler.service';
import { ContextLoaderService } from './services/context-loader.service';
import { RedisSessionService } from './services/redis-session.service';

@Global()
@Module({
  providers: [ContextLoaderService, RedisSessionService, BaseGraphHandlerService],
  exports: [ContextLoaderService, RedisSessionService, BaseGraphHandlerService],
})
export class SharedModule {}
