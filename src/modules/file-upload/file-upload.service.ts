import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { basename, join } from 'path';

// ___CONST___
import { publicApiUrl, uploadDir, UPLOADS_ROUTE } from '../../shared/config/upload.config.js';

const EXTENSIONS: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'application/pdf': 'pdf',
};

/** Stored file names: a random UUID plus extension, so links can't be guessed. */
const STORED_NAME = /^[0-9a-f-]{36}\.[a-z]{3,4}$/;

@Injectable()
export class FileUploadService {

    private readonly logger = new Logger(FileUploadService.name);

    public async saveFile(file: Express.Multer.File) {
        if (!file?.buffer) {
            throw new BadRequestException('No file provided');
        }

        const extension = EXTENSIONS[file.mimetype];
        if (!extension) {
            throw new BadRequestException('Only image or PDF files are allowed');
        }

        const directory = uploadDir();
        const fileName = `${randomUUID()}.${extension}`;

        try {
            await mkdir(directory, { recursive: true });
            await writeFile(join(directory, fileName), file.buffer);
        } catch (error) {
            this.logger.error(`Failed to store upload in ${directory}`, error);
            throw new InternalServerErrorException('Failed to store the file');
        }

        return {
            message: 'File uploaded successfully',
            data: {
                path: `${publicApiUrl()}${UPLOADS_ROUTE}/${fileName}`,
            }
        };
    }

    /**
     * Maps a URL returned by saveFile back to the file on disk.
     * Returns null for anything else, so callers never read arbitrary paths or fetch remote URLs.
     */
    public resolveStoredFile(url: string): string | null {
        let pathname: string;
        try {
            pathname = new URL(url).pathname;
        } catch {
            return null;
        }

        const prefix = `${UPLOADS_ROUTE}/`;
        if (!pathname.startsWith(prefix)) {
            return null;
        }

        const fileName = basename(pathname.slice(prefix.length));
        return STORED_NAME.test(fileName) ? join(uploadDir(), fileName) : null;
    }

    public async removeFile(url: string) {
        const filePath = this.resolveStoredFile(url);
        if (!filePath) {
            return;
        }

        await unlink(filePath).catch((error: NodeJS.ErrnoException) => {
            if (error.code !== 'ENOENT') {
                throw new InternalServerErrorException(`Failed to remove file: ${error.message}`);
            }
        });
    }
}
