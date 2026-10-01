import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import express from 'express';
import { mkdirSync } from 'fs';

// ___INTERCEPTOR___
import { ResponseInterceptor } from '../interceptors/response.interceptor.js';

// ___CONFIG___
import { uploadDir, UPLOADS_ROUTE } from './upload.config.js';

/** Shared setup for the local server (main.ts) and the Vercel handler (api/index.ts). */
export function configureApp(app: INestApplication) {
    const config = app.get(ConfigService);
    const origins = (config.get<string>('CORS_ORIGINS') ?? 'http://localhost:5173')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    app.enableCors({
        origin: origins,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Content-Disposition'],
    });

    // Uploaded receipts. File names are random UUIDs and never change, so cache them for a year.
    const uploads = uploadDir();
    mkdirSync(uploads, { recursive: true });
    app.use(UPLOADS_ROUTE, express.static(uploads, { immutable: true, maxAge: '365d', index: false, dotfiles: 'deny' }));

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));

    app.useGlobalInterceptors(
        new ClassSerializerInterceptor(app.get(Reflector)),
        new ResponseInterceptor(),
    );

    return app;
}
