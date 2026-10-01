import { GoogleGenAI } from '@google/genai';
import { Injectable, InternalServerErrorException, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// CONNECTION
import { GeminiConnection } from '../../connections/gemini.connection.js';

// CONST
import { GEMINI_OUTPUT_SCHEMA } from '../../const/gemini.const.js';

/** Statuses that mean "busy, try again": rate limited, overloaded or timed out. */
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
/** Waits between attempts on the same model. Kept short: the user is waiting on this request. */
const RETRY_DELAYS_MS = [1500];
/**
 * Per-attempt limit. The SDK's own retries are disabled: on a 429 it waits for retry-after
 * and kept a request open for over 5 minutes. Worst case is now ~1 minute in total.
 */
const ATTEMPT_TIMEOUT_MS = 20_000;

function isTimeout(error: unknown) {
    const name = (error as { name?: unknown })?.name;
    return typeof name === 'string' && /timeout|abort/i.test(name);
}

function statusOf(error: unknown): number | undefined {
    const status = (error as { status?: unknown; statusCode?: unknown })?.status
        ?? (error as { statusCode?: unknown })?.statusCode;
    return typeof status === 'number' ? status : undefined;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class GeminiService {
    private readonly logger = new Logger(GeminiService.name);
    private readonly GEMINI: GoogleGenAI;
    private readonly MODEL: string;
    /** Optional second model, used when the main model stays overloaded (GEMINI_FALLBACK_MODEL). */
    private readonly FALLBACK_MODEL: string | undefined;

    constructor(
        private readonly geminiConnection: GeminiConnection,
        private readonly configService: ConfigService
    ){
        const geminiClient = this.geminiConnection.getClient();
        const geminiModel = this.configService.get<string>('GEMINI_MODEL');
        
        if(!geminiClient) {
            throw new Error('Failed to get Gemini Client');
        }

        if(!geminiModel){
            throw new InternalServerErrorException('GEMINI_MODEL environment is not set');
        }

        this.GEMINI = geminiClient;
        this.MODEL = geminiModel;
        this.FALLBACK_MODEL = this.configService.get<string>('GEMINI_FALLBACK_MODEL') || undefined;
    }

    /**
     * Retries the main model with a short backoff when Gemini is busy, then tries the fallback
     * model once. If everything is busy, throws a 503 the frontend can show as "try again later".
     */
    public async prompt(ocrData: string, prompt: string) {
        return this.withRetries((model) => this.promptModel(model, `
                ## PROMPT
                ${prompt}

                ## DATA FROM OCR
                ${ocrData}
            `));
    }

    /** Sends a PDF straight to Gemini, which reads it natively, so no OCR is needed. */
    public async promptWithPdf(pdf: Buffer, prompt: string) {
        return this.withRetries((model) => this.promptModel(model, [
            { type: 'text', text: prompt },
            { type: 'document', data: pdf.toString('base64'), mime_type: 'application/pdf' },
        ]));
    }

    private async withRetries(run: (model: string) => Promise<unknown>) {
        const attempts = [
            ...[0, ...RETRY_DELAYS_MS].map((delay) => ({ model: this.MODEL, delay })),
            ...(this.FALLBACK_MODEL ? [{ model: this.FALLBACK_MODEL, delay: 0 }] : []),
        ];

        let lastError: unknown;
        for (const { model, delay } of attempts) {
            if (delay) await sleep(delay);
            try {
                return await run(model);
            } catch (error) {
                const status = statusOf(error);
                const retryable = isTimeout(error) || (status !== undefined && RETRYABLE_STATUSES.has(status));
                if (!retryable) {
                    throw error;
                }
                lastError = error;
                this.logger.warn(`Gemini ${model} ${isTimeout(error) ? 'timed out' : `returned ${status}`}, retrying`);
            }
        }

        this.logger.error('Gemini stayed unavailable after all retries', lastError instanceof Error ? lastError.message : lastError);
        throw new ServiceUnavailableException('Receipt reading is temporarily unavailable. Try again in a minute or enter the expense manually.');
    }

    private async promptModel(model: string, input: Parameters<GoogleGenAI['interactions']['create']>[0]['input']) {
        const interaction = await this.GEMINI.interactions.create({
            model,
            input,
            response_format: {
                type: 'text',
                mime_type: 'application/json',
                schema: GEMINI_OUTPUT_SCHEMA
            }
        }, { retries: { strategy: 'none' }, timeout_ms: ATTEMPT_TIMEOUT_MS });

        if(interaction.status !== 'completed'){
            throw new Error('Failed to generate response');
        }

        const outputText = interaction.output_text;
        if (typeof outputText === 'string') {
            try {
                return JSON.parse(outputText);
            } catch {
                return outputText;
            }
        }

        return outputText;
    }

    public async execute(prompt: string, path: string){
        try{
            const nFile = await this.fileUpload(path);

            const interaction = await this.GEMINI.interactions.create({
                model: this.MODEL,
                input: [
                    { type: 'text', text: prompt},
                    { type: 'image', uri: nFile.uri, mime_type: nFile.  mimeType }
                ],
                response_format: {
                    type: 'text',
                    mime_type: 'application/json',
                    schema: GEMINI_OUTPUT_SCHEMA
                }
            })

            if(!interaction) throw new Error('Failed to execute prompt with image')

            const outputText = interaction.output_text;
            if (typeof outputText === 'string') {
                try {
                    return JSON.parse(outputText);
                } catch {
                    return outputText;
                }
            }

            return outputText;
        }catch(error){
            console.error(error);
            throw new InternalServerErrorException(
                `Failed to execute prompt: ${error instanceof Error ? error.message : String(error)}`,
            );
        }


    }

    private async fileUpload(path: string) {
        const nFile = await this.GEMINI.files.upload({
            file: path,
            config: { mimeType: 'image/jpeg' }
        })

        if(!nFile) throw new Error(`Failed to upload image: ${"colruyt_lichtelijk_scheef.jpg"}`);

        return {
            uri: nFile.uri,
            mimeType: nFile.mimeType
        }
    }

}