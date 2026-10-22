import { OllamaService } from './ollama.service.js';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const ok = () => json({ message: { content: '{"items":[]}' } });

function makeService(env: Record<string, string | undefined> = {}) {
    const values: Record<string, string | undefined> = { OLLAMA_BASE_URL: 'http://ollama.test/', OLLAMA_MODEL: 'gemma4:e4b', ...env };
    return new OllamaService({ get: (key: string) => values[key] } as never);
}

describe('OllamaService', () => {
    const fetchMock = vi.fn();

    beforeEach(() => vi.stubGlobal('fetch', fetchMock));
    afterEach(() => {
        vi.unstubAllGlobals();
        fetchMock.mockReset();
    });

    it('only handles supported types when configured', () => {
        expect(makeService().canHandle('image/jpeg')).toBe(true);
        expect(makeService().canHandle('application/pdf')).toBe(true);
        expect(makeService().canHandle('image/heic')).toBe(false);
        expect(makeService({ OLLAMA_BASE_URL: undefined }).canHandle('image/jpeg')).toBe(false);
        expect(makeService({ OLLAMA_MODEL: undefined }).canHandle('image/jpeg')).toBe(false);
    });

    it('sends the image to /api/chat with the schema and parses the answer', async () => {
        fetchMock.mockResolvedValue(ok());
        const result = await makeService().promptWithFile(Buffer.from('img'), 'image/jpeg', 'prompt');

        expect(result).toEqual({ items: [] });
        const [url, init] = fetchMock.mock.calls[0];
        const body = JSON.parse(init.body);
        expect(url).toBe('http://ollama.test/api/chat');
        expect(body.model).toBe('gemma4:e4b');
        expect(body.messages[0].images).toEqual([Buffer.from('img').toString('base64')]);
        expect(body.format.type).toBe('object');
    });

    it('sends Cloudflare Access headers when configured', async () => {
        fetchMock.mockResolvedValue(ok());
        await makeService({ OLLAMA_CF_ACCESS_CLIENT_ID: 'id', OLLAMA_CF_ACCESS_CLIENT_SECRET: 'secret' })
            .promptWithFile(Buffer.from('img'), 'image/jpeg', 'prompt');

        expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ 'CF-Access-Client-Id': 'id', 'CF-Access-Client-Secret': 'secret' });
    });

    it('throws on an error status', async () => {
        fetchMock.mockResolvedValue(json({ error: 'model not found' }, 404));
        await expect(makeService().promptWithFile(Buffer.from('img'), 'image/jpeg', 'prompt')).rejects.toThrow('Ollama returned 404');
    });
});
