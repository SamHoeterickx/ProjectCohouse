import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { House } from '../house/entity/house.entity.js';
import { User } from '../user/entity/user.entity.js';
import { Receipt } from './entity/receipt.entity.js';
import { IReceiptResponse } from './interfaces/receipt-response.interface.js';
import { GeminiService } from '../../shared/utils/gemini/gemini.service.js';
import { FileUploadService } from '../file-upload/file-upload.service.js';
import { PROMPT } from '../../shared/const/gemini.const.js';
import { IServiceResponse } from '../../shared/interfaces/service-response.interface.js';
import { OcrService } from '../../shared/utils/ocr/ocr.service.js';

@Injectable()
export class ReceiptService {

    constructor(
        @InjectRepository(Receipt) private readonly receiptRepository: Repository<Receipt>,
        private readonly geminiService: GeminiService,
        private readonly fileUploadService: FileUploadService,
        private readonly ocrService: OcrService,
    ) {}

    public async extractGroceriesFromReceipt(path: string, house: House, currentUser: User) {
        const ocrText = await this.ocrService.extract(path);
        const result = await this.geminiService.prompt(ocrText, PROMPT);

        console.log(result);

        return {
            message: 'Receipt extracted successfully',
            data: {
                receiptData: result
            }
        }
    }
}
