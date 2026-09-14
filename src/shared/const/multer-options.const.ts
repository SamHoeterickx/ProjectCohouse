import { diskStorage } from "multer";
import { Request } from "express";

type MulterFileFilterCallback = (error: Error | null, acceptFile: boolean) => void;

export const MULTER_OPTIONS = {
    storage: diskStorage({
        destination: './uploads',
        filename: (_req: Request, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => {
            const suffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const originalName = file.originalname.replace(/\s+/g, '_');
            const fileName = `${suffix}-${originalName}`;
            callback(null, fileName);
        }
    }),
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