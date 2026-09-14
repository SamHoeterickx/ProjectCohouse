import { GoogleGenAI } from '@google/genai';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// CONNECTION
import { GeminiConnection } from '../../connections/gemini.connection.js';

// CONST
import { GEMINI_OUTPUT_SCHEMA } from '../../const/gemini.const.js';

@Injectable()
export class GeminiService {
    private readonly GEMINI: GoogleGenAI;
    private readonly MODEL: string;

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
    }

    public async prompt(ocrData: string, prompt: string) {
        const interaction = await this.GEMINI.interactions.create({
            model: this.MODEL,
            input: `
                ## PROMPT
                ${prompt}

                ## DATA FROM OCR
                ${ocrData}
            `,
            response_format: {
                type: 'text',
                mime_type: 'application/json',
                schema: GEMINI_OUTPUT_SCHEMA
            }
        });

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