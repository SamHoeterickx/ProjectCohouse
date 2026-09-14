import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { access, mkdir, unlink, writeFile } from 'fs/promises';

@Injectable()
export class FileUploadService {

    constructor(){}

    public async saveFile(file: Express.Multer.File) {
        if (!file) {
            throw new Error('No file provided');
        }

        console.log(file);

        // const uploadDir = './uploads';
        // await mkdir(uploadDir, { recursive: true });

        // if (file.buffer) {
        //     const uploadPath = `${uploadDir}/${file.originalname}`;
        //     await writeFile(uploadPath, file.buffer);

        //     return {
        //         message: 'File uploaded successfully',
        //         path: uploadPath
        //     };
        // }

        // const diskPath = (file as any).path || ((file as any).destination && (file as any).filename ? `${(file as any).destination}/${(file as any).filename}` : undefined);

        // if (diskPath) {
        //     return {
        //         message: 'File uploaded successfully',
        //         data: {
        //             path: diskPath
        //         }
        //     };

        // }
        // throw new Error('Uploaded file has no buffer or path');
    }

    public async removeFile(path: string) {
        if (!path) {
            return;
        }

        try {
            await access(path);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                return;
            }

            console.error(error);
            throw new InternalServerErrorException(
                `Failed to remove file: ${error instanceof Error ? error.message : String(error)}`
            );
        }

        await unlink(path);
    }
}