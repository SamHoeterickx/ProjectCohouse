import { Injectable } from '@nestjs/common';
import { createWorker } from 'tesseract.js';

@Injectable()
export class OcrService {
    /** Accepts a file path or the raw image buffer. */
    public async extract(image: string | Buffer): Promise<string>{
        const worker = await createWorker('nld');
        try {
            const { data } = await worker.recognize(image);
            return data.text;
        } finally {
            await worker.terminate();
        }
    }
}
