import { memoryStorage } from "multer";
import { Request } from "express";

type MulterFileFilterCallback = (error: Error | null, acceptFile: boolean) => void;

export const MULTER_OPTIONS = {
    storage: memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: (_req: Request, file: Express.Multer.File, callback: MulterFileFilterCallback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|pdf)$/)) {
            return callback(new Error('Only image or PDF files are allowed!'), false);
        }
        callback(null, true);
    },
};