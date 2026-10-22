import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ReceiptController } from './receipt.controller.js';
import { ReceiptService } from './receipt.service.js';
import { GeminiModule } from '../../shared/utils/gemini/gemini.module.js';
import { OllamaModule } from '../../shared/utils/ollama/ollama.module.js';
import { FileUploadModule } from '../file-upload/file-upload.module.js';
import { HouseAccessModule } from '../../shared/utils/house-access/house-access.module.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    OllamaModule,
    GeminiModule,
    FileUploadModule,
    HouseAccessModule,
  ],
  controllers: [ReceiptController],
  providers: [ReceiptService]
})
export class ReceiptModule {}
