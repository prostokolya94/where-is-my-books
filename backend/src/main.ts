import 'dotenv/config';
import type { Express } from 'express';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  if (
    process.env.NODE_ENV === 'production' &&
    (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev-secret-change-me')
  ) {
    throw new Error(
      'NODE_ENV=production requires a strong JWT_SECRET to be set in .env',
    );
  }

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const expressApp = app.getHttpAdapter().getInstance() as Express;
  expressApp.set('trust proxy', 1);

  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  app.enableCors(
    corsOrigin.length
      ? { origin: corsOrigin, credentials: true }
      : { origin: true, credentials: true },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  const port = Number(process.env.PORT || 3001);
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  console.log(`Backend is running on http://${host}:${port}/api`);
}
void bootstrap();
