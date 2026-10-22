import './shared/config/timezone.js';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './modules/app/app.module.js';
import { configureApp } from './shared/config/app.config.js';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));
  const config = app.get(ConfigService);
  const port = 8080;

  console.log(`Backend successfully started on ${port}`);

  await app.listen(config.get('PORT') ?? 3000);
}
bootstrap().catch((error) => {
  console.error('Failed to start the application', error);
  process.exit(1);
});
