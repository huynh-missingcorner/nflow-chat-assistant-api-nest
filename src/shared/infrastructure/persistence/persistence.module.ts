import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PersistenceService } from './persistence.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PersistenceService],
  exports: [PersistenceService],
})
export class PersistenceModule {}
