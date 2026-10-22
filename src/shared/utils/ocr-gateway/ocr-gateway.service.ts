import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** The gateway runs the local model, which is slow: allow at least its own 90s limit. */
const TIMEOUT_MS = 95_000;
/** What the gateway accepts; PDF and HEIC are left to the fallback. */
const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Injectable()
export class OcrGatewayService {
    private readonly BASE_URL: string | undefined;
    private readonly API_KEY: string | undefined;
    /** OCR_FALLBACK_GEMINI=true: keep using the older readers (Ollama/Gemini) when the gateway fails. */
    public readonly fallbackToGemini: boolean;

    constructor(private readonly configService: ConfigService) {
        const baseUrl = this.configService.get<string>('OCR_GATEWAY_URL');
        this.BASE_URL = baseUrl ? baseUrl.replace(/\/+$/, '') : undefined;
        this.API_KEY = this.configService.get<string>('OCR_GATEWAY_KEY') || undefined;
        this.fallbackToGemini = this.configService.get<string>('OCR_FALLBACK_GEMINI') === 'true';
    }

    /** True when the gateway is configured and can read this file type. */
    public canHandle(mimeType: string) {
        return Boolean(this.BASE_URL && this.API_KEY) && SUPPORTED_MIME_TYPES.has(mimeType);
    }

    /** Sends a receipt image to the OCR gateway. Throws on any failure; the caller decides about a fallback. */
    public async promptWithFile(file: Buffer, mimeType: string) {
        const form = new FormData();
        form.append('file', new Blob([new Uint8Array(file)], { type: mimeType }), 'receipt');

        const response = await fetch(`${this.BASE_URL}/scan`, {
            method: 'POST',
            headers: { 'X-API-Key': this.API_KEY as string },
            body: form,
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });

        if (!response.ok) {
            throw new Error(`OCR gateway returned ${response.status}`);
        }

        return response.json();
    }
}
