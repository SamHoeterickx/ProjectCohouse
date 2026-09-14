import { GoogleGenAI } from "@google/genai";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class GeminiConnection {
    private GEMINI_API_KEY: string;
    public readonly GEMINI: GoogleGenAI;

    constructor(private configService: ConfigService) {
        const apiKey = configService.get<string>('GEMINI_API_KEY');

        if (!apiKey){
            throw new InternalServerErrorException('GEMINI_API_KEY environment is not set')
        }
        
        this.GEMINI_API_KEY = apiKey;
        this.GEMINI = new GoogleGenAI({ apiKey: this.GEMINI_API_KEY });
    }

    public getApiKey(): string {
        return this.GEMINI_API_KEY;
    }

    public getClient(): GoogleGenAI {
        return this.GEMINI;
    }
}