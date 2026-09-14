import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import serverless from 'serverless-http';
import { AppModule } from '../src/modules/app/app.module.js';
import { ResponseInterceptor } from '../src/shared/interceptors/response.interceptor.js';

let cachedHandler: ReturnType<typeof serverless>;

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
    }));

    app.useGlobalInterceptors(
        new ClassSerializerInterceptor(app.get(Reflector)),
        new ResponseInterceptor(),
    );

    await app.init();

    return serverless(app.getHttpAdapter().getInstance());
}

export default async function handler(req: any, res: any) {
    if (!cachedHandler) {
        cachedHandler = await bootstrap();
    }

    return cachedHandler(req, res);
}
