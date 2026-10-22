import { readFile } from 'node:fs/promises';
import { BadGatewayException, BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

// ___SERVICE___
import { OcrGatewayService } from '../../shared/utils/ocr-gateway/ocr-gateway.service.js';
import { OllamaService } from '../../shared/utils/ollama/ollama.service.js';
import { GeminiService } from '../../shared/utils/gemini/gemini.service.js';
import { FileUploadService } from '../file-upload/file-upload.service.js';

// ___CONST___
import { PROMPT } from '../../shared/const/receipt.const.js';

// ___INTERFACE___
import { IReceiptResponse } from './interfaces/receipt-response.interface.js';

// ___UTILS___
import { receiptDateToIso } from '../../shared/utils/date/date.util.js';

const UNKNOWN_STORE = 'Onbekende Winkel';

/** Detected from the bytes, not the upload's mimetype, so a wrong mimetype can't send a file to the model mislabeled. */
function sniffMimeType(buffer: Buffer): string | null {
    if (buffer.subarray(0, 4).toString('latin1') === '%PDF') return 'application/pdf';
    if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
    if (buffer.subarray(1, 4).toString('latin1') === 'PNG') return 'image/png';
    if (buffer.subarray(0, 4).toString('latin1') === 'RIFF' && buffer.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
    if (buffer.subarray(4, 8).toString('latin1') === 'ftyp') {
        const brand = buffer.subarray(8, 12).toString('latin1');
        if (brand.startsWith('hei') || brand.startsWith('mif')) return brand.startsWith('hei') ? 'image/heic' : 'image/heif';
    }
    return null;
}

@Injectable()
export class ReceiptService {
    private readonly logger = new Logger(ReceiptService.name);

    private elapsed(since: number) {
        return Math.round(performance.now() - since);
    }

    constructor(
        private readonly ocrGatewayService: OcrGatewayService,
        private readonly ollamaService: OllamaService,
        private readonly geminiService: GeminiService,
        private readonly fileUploadService: FileUploadService,
    ) {}

    /**
     * Reads a receipt and returns a draft the frontend can show for review.
     * Nothing is stored: the user corrects the draft, assigns items and posts it as an expense.
     */
    public async extractGroceriesFromReceipt(path: string) {
        // Only files stored by our own upload endpoint are read, never arbitrary URLs (prevents SSRF).
        const filePath = this.fileUploadService.resolveStoredFile(path);
        if (!filePath) {
            throw new BadRequestException('Receipt must be uploaded through the file upload endpoint first');
        }

        return this.extractFromFile(await readFile(filePath), path);
    }

    public async scan(file: Express.Multer.File) {
        const { data } = await this.fileUploadService.saveFile(file);

        // Read straight from memory instead of reading the file we just wrote.
        return this.extractFromFile(file.buffer, data.path);
    }

    /** Reads the receipt with the OCR gateway first; when it fails, OCR_FALLBACK_GEMINI=true lets the older readers take over. */
    private async prompt(file: Buffer, mimeType: string) {
        if (this.ocrGatewayService.canHandle(mimeType)) {
            try {
                const result = await this.ocrGatewayService.promptWithFile(file, mimeType);
                if (result && typeof result === 'object' && Array.isArray((result as IReceiptResponse).items)) {
                    return result;
                }
                throw new Error('OCR gateway returned an unusable receipt');
            } catch (error) {
                const reason = error instanceof Error ? error.message : error;
                if (!this.ocrGatewayService.fallbackToGemini) {
                    this.logger.error(`OCR gateway failed (${reason})`);
                    throw new ServiceUnavailableException('Receipt reading is temporarily unavailable. Try again in a minute or enter the expense manually.');
                }
                this.logger.warn(`OCR gateway failed (${reason}), falling back to Gemini`);
            }
        }

        return this.promptLegacy(file, mimeType);
    }

    /** Reads the receipt with the local Ollama model; Gemini takes over when Ollama is unconfigured, unsupported or fails. */
    private async promptLegacy(file: Buffer, mimeType: string) {
        if (this.ollamaService.canHandle(mimeType)) {
            try {
                const result = await this.ollamaService.promptWithFile(file, mimeType, PROMPT);
                if (result && typeof result === 'object' && Array.isArray((result as IReceiptResponse).items)) {
                    return result;
                }
                this.logger.warn('Ollama returned an unusable receipt, falling back to Gemini');
            } catch (error) {
                this.logger.warn(`Ollama failed (${error instanceof Error ? error.message : error}), falling back to Gemini`);
            }
        }

        return this.geminiService.promptWithFile(file, mimeType, PROMPT);
    }

    private async extractFromFile(file: Buffer, receiptUrl: string) {
        const mimeType = sniffMimeType(file);
        if (!mimeType) {
            throw new BadRequestException('Receipt must be a JPEG, PNG, WebP, HEIC or PDF file');
        }

        const startedAt = performance.now();
        const result = await this.prompt(file, mimeType);
        this.logger.log(`Receipt scan timing: ${this.elapsed(startedAt)}ms`);

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
                receipt_url: receiptUrl,
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
}
