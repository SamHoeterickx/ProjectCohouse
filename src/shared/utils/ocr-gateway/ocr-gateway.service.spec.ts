import { OcrGatewayService } from './ocr-gateway.service.js';

function makeService(env: Record<string, string | undefined> = {}) {
    const values: Record<string, string | undefined> = { OCR_GATEWAY_URL: 'http://gateway.test/', OCR_GATEWAY_KEY: 'secret', ...env };
    return new OcrGatewayService({ get: (key: string) => values[key] } as never);
}

describe('OcrGatewayService', () => {
    const fetchMock = vi.fn();

    beforeEach(() => vi.stubGlobal('fetch', fetchMock));
    afterEach(() => {
        vi.unstubAllGlobals();
        fetchMock.mockReset();
    });

    it('only handles supported types when configured', () => {
        expect(makeService().canHandle('image/jpeg')).toBe(true);
        expect(makeService().canHandle('application/pdf')).toBe(false);
        expect(makeService({ OCR_GATEWAY_KEY: undefined }).canHandle('image/jpeg')).toBe(false);
    });

    it('posts the file with the API key and returns the JSON', async () => {
        fetchMock.mockResolvedValue(new Response('{"items":[]}'));
        const result = await makeService().promptWithFile(Buffer.from('img'), 'image/jpeg');

        expect(result).toEqual({ items: [] });
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('http://gateway.test/scan');
        expect(init.headers).toEqual({ 'X-API-Key': 'secret' });
        expect(init.body.get('file')).toBeInstanceOf(Blob);
    });

    it('throws on an error status', async () => {
        fetchMock.mockResolvedValue(new Response('{}', { status: 503 }));
        await expect(makeService().promptWithFile(Buffer.from('img'), 'image/jpeg')).rejects.toThrow('OCR gateway returned 503');
    });

    it('reads the fallback switch', () => {
        expect(makeService().fallbackToGemini).toBe(false);
        expect(makeService({ OCR_FALLBACK_GEMINI: 'true' }).fallbackToGemini).toBe(true);
    });
});
