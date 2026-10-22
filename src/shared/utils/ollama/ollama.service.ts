import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { pdf } from 'pdf-to-img';

// CONST
import { RECEIPT_OUTPUT_SCHEMA } from '../../const/receipt.const.js';

/** A small local model reading an image is far slower than a hosted API, but the caller falls back to Gemini after this. */
const TIMEOUT_MS = 90_000;
/** A receipt PDF is a few pages at most; more pages only slow the model down. */
const MAX_PDF_PAGES = 3;
/** Image formats Ollama can decode. Anything else (HEIC, ...) is left to the fallback. */
const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

@Injectable()
export class OllamaService {
    private readonly logger = new Logger(OllamaService.name);
    private readonly BASE_URL: string | undefined;
    private readonly MODEL: string | undefined;
    private readonly HEADERS: Record<string, string> = { 'Content-Type': 'application/json' };

    constructor(private readonly configService: ConfigService) {
        const baseUrl = this.configService.get<string>('OLLAMA_BASE_URL');
        this.BASE_URL = baseUrl ? baseUrl.replace(/\/+$/, '') : undefined;
        this.MODEL = this.configService.get<string>('OLLAMA_MODEL') || undefined;

        // Optional: Cloudflare Access service token when the Ollama endpoint sits behind a protected tunnel.
        const accessId = this.configService.get<string>('OLLAMA_CF_ACCESS_CLIENT_ID');
        const accessSecret = this.configService.get<string>('OLLAMA_CF_ACCESS_CLIENT_SECRET');
        if (accessId && accessSecret) {
            this.HEADERS['CF-Access-Client-Id'] = accessId;
            this.HEADERS['CF-Access-Client-Secret'] = accessSecret;
        }
    }

    /** True when Ollama is configured and can read this file type. */
    public canHandle(mimeType: string) {
        return Boolean(this.BASE_URL && this.MODEL) && SUPPORTED_MIME_TYPES.has(mimeType);
    }

    /**
     * Sends a receipt (photo or PDF) to the local vision model. Ollama only takes images, so a PDF
     * is rendered to page images first. Throws on any failure; the caller decides about a fallback.
     */
    public async promptWithFile(file: Buffer, mimeType: string, prompt: string) {
        const images = mimeType === 'application/pdf' ? await this.pdfToImages(file) : [file];

        const response = await fetch(`${this.BASE_URL}/api/chat`, {
            method: 'POST',
            headers: this.HEADERS,
            body: JSON.stringify({
                model: this.MODEL,
                stream: false,
                think: false,
                // Constrains the output to the receipt schema, so the answer is always valid JSON.
                format: RECEIPT_OUTPUT_SCHEMA,
                options: { temperature: 0 },
                messages: [{ role: 'user', content: prompt, images: images.map((image) => image.toString('base64')) }],
            }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });

        if (!response.ok) {
            throw new Error(`Ollama returned ${response.status}: ${(await response.text()).slice(0, 200)}`);
        }

        const { message } = await response.json() as { message?: { content?: string } };
        if (typeof message?.content !== 'string') {
            throw new Error('Ollama returned no content');
        }

        return JSON.parse(message.content);
    }

    private async pdfToImages(file: Buffer) {
        const pages: Buffer[] = [];
        const document = await pdf(file, { scale: 2 });
        for await (const page of document) {
            pages.push(page);
            if (pages.length >= MAX_PDF_PAGES) break;
        }

        if (!pages.length) {
            throw new InternalServerErrorException('Could not render the PDF receipt');
        }
        return pages;
    }
}
