import { Module, Global } from '@nestjs/common';
import { ContextLoaderService } from './services/context-loader.service';

@Global()
@Module({
  providers: [ContextLoaderService],
  exports: [ContextLoaderService],
})
export class SharedModule {}
