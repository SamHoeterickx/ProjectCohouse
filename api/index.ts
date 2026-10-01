import '../src/shared/config/timezone.js';
import { NestFactory } from '@nestjs/core';
import serverless from 'serverless-http';
import { AppModule } from '../src/modules/app/app.module.js';
import { configureApp } from '../src/shared/config/app.config.js';

let cachedHandler: ReturnType<typeof serverless>;

async function bootstrap() {
    const app = configureApp(await NestFactory.create(AppModule));

    await app.init();

    return serverless(app.getHttpAdapter().getInstance());
}

export default async function handler(req: any, res: any) {
    if (!cachedHandler) {
        cachedHandler = await bootstrap();
    }

    return cachedHandler(req, res);
}
