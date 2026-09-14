import { Module } from '@nestjs/common';
import { GeminiConnection } from '../../connections/gemini.connection.js';
import { GeminiService } from './gemini.service.js';

@Module({
  providers: [GeminiConnection, GeminiService],
  exports: [GeminiService],
})
export class GeminiModule {}
