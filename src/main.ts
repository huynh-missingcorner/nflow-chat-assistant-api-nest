import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import validationConfig from './config/validation/validation.config';
import { Request, Response } from 'express';
import session from 'express-session';
import { RedisSessionService } from './shared/services/redis-session.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for REST API and WebSockets
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Get the RedisSessionService from the app context
  const redisSessionService = app.get(RedisSessionService);

  app.use(session(redisSessionService.getSessionConfig()));

  app.useGlobalPipes(new ValidationPipe(validationConfig()));

  // Set up Swagger documentation (only in non-production)
  if (process.env.NODE_ENV !== 'production') {
    const configSwagger = new DocumentBuilder()
      .setTitle('Nflow Chat Assistant API')
      .setDescription(
        'API for the Nflow Chat Assistant that interprets user prompts and interacts with the Nflow no-code platform',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, configSwagger);
    SwaggerModule.setup('api/docs', app, document);

    // Add route to download swagger.json
    app.getHttpAdapter().get('/api/docs/swagger.json', (req: Request, res: Response) => {
      res.json(document);
    });
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API documentation available at: http://localhost:${port}/api`);
  console.log(`🔌 WebSocket server is running on: ws://localhost:${port}`);
  console.log(`💾 Sessions are being stored in Redis`);
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap the application:', error);
  process.exit(1);
});
