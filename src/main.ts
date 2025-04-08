import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import validationConfig from './config/validation/validation.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for REST API and WebSockets
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe(validationConfig()));

  // Set up Swagger documentation
  const configSwagger = new DocumentBuilder()
    .setTitle('Nflow Chat Assistant API')
    .setDescription(
      'API for the Nflow Chat Assistant that interprets user prompts and interacts with the Nflow no-code platform',
    )
    .setVersion('1.0')
    .addTag('Chat')
    .build();

  const document = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API documentation available at: http://localhost:${port}/api`);
  console.log(`🔌 WebSocket server is running on: ws://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap the application:', error);
  process.exit(1);
});
