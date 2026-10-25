import { Module } from '@nestjs/common';
import { OcrGatewayService } from './ocr-gateway.service.js';

@Module({
  providers: [OcrGatewayService],
  exports: [OcrGatewayService],
})
export class OcrGatewayModule {}
