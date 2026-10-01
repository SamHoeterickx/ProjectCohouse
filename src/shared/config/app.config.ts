import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

// ___INTERCEPTOR___
import { ResponseInterceptor } from '../interceptors/response.interceptor.js';

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
