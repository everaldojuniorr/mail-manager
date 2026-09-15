import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

const API_PREFIXES = ['/auth', '/folders', '/messages'];

function isApiPath(pathname: string): boolean {
  return API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.WEB_ORIGIN,
    'https://webmail.financyexpert.com',
  ].filter((v): v is string => Boolean(v));

  app.enableCors({
    origin: origins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const webDist = process.env.WEB_DIST;
  if (webDist && existsSync(webDist)) {
    app.useStaticAssets(webDist, { index: false });
    const indexHtml = join(webDist, 'index.html');
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      if (isApiPath(req.path)) return next();
      if (req.path.includes('.') && !req.path.endsWith('.html')) return next();
      res.sendFile(indexHtml);
    });
  }

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`API listening on http://0.0.0.0:${port}`);
  if (webDist && existsSync(webDist)) {
    console.log(`Serving SPA from ${webDist}`);
  }
}

bootstrap();
