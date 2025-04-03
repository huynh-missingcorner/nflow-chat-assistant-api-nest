import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InfrastructureModule } from './shared/infrastructure/infrastructure.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule, InfrastructureModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
