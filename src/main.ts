import './shared/config/timezone.js';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './modules/app/app.module.js';
import { configureApp } from './shared/config/app.config.js';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));
  const config = app.get(ConfigService);

  await app.listen(config.get('PORT') ?? 3000);
}
await bootstrap();
