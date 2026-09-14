import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

// ___SERVICE___
import { FileUploadService } from './file-upload.service.js';

// ___CONST___
import { MULTER_OPTIONS } from '../../shared/const/multer-options.const.js';

// ___GUARDS___
import { JwtAuthGuard } from '../../shared/utils/token/jwt-auth.guard.js';

@Controller('file-upload')
@UseGuards(JwtAuthGuard)
export class FileUploadController {

    constructor(
        private readonly fileUploadService: FileUploadService
    ){}

    @Post('/upload')
    @UseInterceptors(FileInterceptor('file', MULTER_OPTIONS))
    public async uploadFile(@UploadedFile() file: Express.Multer.File) {
        return await this.fileUploadService.saveFile(file);
    }
}
