import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { del, put } from '@vercel/blob';

@Injectable()
export class FileUploadService {

    constructor(){}

    public async saveFile(file: Express.Multer.File) {
        if (!file) {
            throw new Error('No file provided');
        }

        if (!file.buffer) {
            throw new Error('Uploaded file has no buffer');
        }

        const suffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const originalName = file.originalname.replace(/\s+/g, '_');
        const fileName = `${suffix}-${originalName}`;

        const blob = await put(fileName, file.buffer, {
            access: 'public',
            contentType: file.mimetype,
        });

        return {
            message: 'File uploaded successfully',
            data: {
                path: blob.url,
            }
        };
    }

    public async removeFile(path: string) {
        if (!path) {
            return;
        }

        try {
            await del(path);
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException(
                `Failed to remove file: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }
}