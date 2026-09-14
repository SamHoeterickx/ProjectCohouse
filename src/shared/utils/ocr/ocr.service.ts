import { Injectable } from '@nestjs/common';
import { createWorker } from 'tesseract.js';

@Injectable()
export class OcrService {
    public async extract(imagePath: string): Promise<string>{
        const worker = await createWorker('nld');
        const { data } = await worker.recognize(imagePath);
        worker.terminate();
        
        return data.text;
    }
}
