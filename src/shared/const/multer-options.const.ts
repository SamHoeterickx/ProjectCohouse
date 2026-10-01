import { BadRequestException } from "@nestjs/common";
import { memoryStorage } from "multer";
import { Request } from "express";

type MulterFileFilterCallback = (error: Error | null, acceptFile: boolean) => void;

export const ALLOWED_UPLOAD_MIME_TYPES = /^(image\/(jpe?g|png|gif|webp|heic|heif)|application\/pdf)$/;

export const MULTER_OPTIONS = {
    storage: memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 10
    },
    fileFilter: (_req: Request, file: Express.Multer.File, callback: MulterFileFilterCallback) => {
        if (!ALLOWED_UPLOAD_MIME_TYPES.test(file.mimetype)) {
            return callback(new BadRequestException('Only image (jpg, png, gif, webp, heic) or PDF files are allowed!'), false);
        }
        callback(null, true);
    },
};
