import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceiptController } from './receipt.controller.js';
import { ReceiptService } from './receipt.service.js';
import { Receipt } from './entity/receipt.entity.js';
import { GeminiModule } from '../../shared/utils/gemini/gemini.module.js';
import { FileUploadModule } from '../file-upload/file-upload.module.js';
import { OcrModule } from '../../shared/utils/ocr/ocr.module.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Receipt]),
    GeminiModule,
    FileUploadModule,
    OcrModule,
  ],
  controllers: [ReceiptController],
  providers: [ReceiptService]
})
export class ReceiptModule {}
