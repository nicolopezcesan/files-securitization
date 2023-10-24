import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';
import { ConfigService } from '@nestjs/config';
 

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const configService = app.get(ConfigService);
  app.setGlobalPrefix('');
  app.use(express.json());
  
  const config = new DocumentBuilder()
    .setTitle('Inmuta CORE API')
    .setDescription('API de Inmuta')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Inmuta CORE API Docs',
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  await app.listen(process.env.PORT || 3000, () => {
    console.log('Inmuta CORE API started successfully', {
      port: process.env.PORT,
      environment: process.env.ENVIRONMENT,
    });
  });
}
bootstrap();
