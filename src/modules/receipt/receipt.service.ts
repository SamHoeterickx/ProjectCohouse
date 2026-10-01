import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';

// ___SERVICE___
import { GeminiService } from '../../shared/utils/gemini/gemini.service.js';
import { FileUploadService } from '../file-upload/file-upload.service.js';
import { OcrService } from '../../shared/utils/ocr/ocr.service.js';

// ___CONST___
import { PROMPT } from '../../shared/const/gemini.const.js';

// ___INTERFACE___
import { IReceiptResponse } from './interfaces/receipt-response.interface.js';

// ___UTILS___
import { receiptDateToIso } from '../../shared/utils/date/date.util.js';

const UNKNOWN_STORE = 'Onbekende Winkel';

/** Only receipts stored through our own upload endpoint may be fetched (prevents SSRF). */
const ALLOWED_RECEIPT_HOST_SUFFIX = '.blob.vercel-storage.com';

@Injectable()
export class ReceiptService {

    constructor(
        private readonly geminiService: GeminiService,
        private readonly fileUploadService: FileUploadService,
        private readonly ocrService: OcrService,
    ) {}

    /**
     * Reads a receipt and returns a draft the frontend can show for review.
     * Nothing is stored: the user corrects the draft, assigns items and posts it as an expense.
     */
    public async extractGroceriesFromReceipt(path: string) {
        const { protocol, hostname } = new URL(path);
        if (protocol !== 'https:' || !hostname.endsWith(ALLOWED_RECEIPT_HOST_SUFFIX)) {
            throw new BadRequestException('Receipt must be uploaded through the file upload endpoint first');
        }

        const ocrText = await this.ocrService.extract(path);
        const result = await this.geminiService.prompt(ocrText, PROMPT);

        if (!result || typeof result !== 'object' || !Array.isArray((result as IReceiptResponse).items)) {
            throw new BadGatewayException('Could not read the receipt, please try again or enter it manually');
        }

        const receipt = result as IReceiptResponse;
        const items = receipt.items.map((item) => ({
            name: item.name,
            amount: item.amount ?? 1,
            price_per_unit: item.price_per_unit,
            discount_in_cents: item.discount_in_cents ?? 0,
            price: item.price,
        }));
        const itemsTotal = items.reduce((sum, item) => sum + item.price, 0);

        return {
            message: 'Receipt extracted successfully',
            data: {
                receipt_url: path,
                store: receipt.store_name && receipt.store_name !== UNKNOWN_STORE ? receipt.store_name : null,
                date: receiptDateToIso(receipt.date),
                amount_in_cents: receipt.total_price,
                items,
                items_total_in_cents: itemsTotal,
                // Lets the frontend warn the user when lines are missing or misread.
                totals_match: itemsTotal === receipt.total_price,
            }
        }
    }

    public async scan(file: Express.Multer.File) {
        const { data } = await this.fileUploadService.saveFile(file);

        return this.extractGroceriesFromReceipt(data.path);
    }
}
