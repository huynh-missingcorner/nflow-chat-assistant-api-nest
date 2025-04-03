import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import validationConfig from './config/validation/validation.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap the application:', error);
  process.exit(1);
});
