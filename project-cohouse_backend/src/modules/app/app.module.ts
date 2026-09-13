import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// ___MODULE___
import { AuthModule } from '../auth/auth.module.js';
import { UserModule } from '../user/user.module.js';
import { ReceiptModule } from '../receipt/receipt.module.js';
import { HouseModule } from '../house/house.module.js';

// ___SERVICE___
import { AppService } from './app.service.js';

// ___CONTROLLER___
import { AppController } from './app.controller.js';
import { FileUploadModule } from '../file-upload/file-upload.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: 'env/.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    UserModule,
    AuthModule,
    HouseModule,
    ReceiptModule,
    FileUploadModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
