import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { FileUploadController } from './file-upload.controller.js';
import { FileUploadService } from './file-upload.service.js';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [FileUploadController],
  providers: [FileUploadService],
  exports: [FileUploadService]
})
export class FileUploadModule {}
