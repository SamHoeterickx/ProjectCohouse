import { ServiceUnavailableException } from '@nestjs/common';
import { GeminiService } from './gemini.service.js';

const busy = Object.assign(new Error('high demand'), { status: 503 });
const ok = { status: 'completed', output_text: '{"items":[]}' };

function makeService(create: ReturnType<typeof vi.fn>, fallback?: string) {
    const connection = { getClient: () => ({ interactions: { create } }) };
    const config = { get: (key: string) => ({ GEMINI_MODEL: 'main', GEMINI_FALLBACK_MODEL: fallback })[key] };
    return new GeminiService(connection as never, config as never);
}

describe('GeminiService.prompt retries', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('retries the main model when Gemini is busy', async () => {
        const create = vi.fn().mockRejectedValueOnce(busy).mockResolvedValueOnce(ok);
        const result = makeService(create).prompt('ocr', 'prompt');
        await vi.runAllTimersAsync();

        await expect(result).resolves.toEqual({ items: [] });
        expect(create).toHaveBeenCalledTimes(2);
    });

    it('falls back to the second model and then gives a clean 503', async () => {
        const create = vi.fn().mockRejectedValue(busy);
        const result = makeService(create, 'lite').prompt('ocr', 'prompt');
        const assertion = expect(result).rejects.toBeInstanceOf(ServiceUnavailableException);
        await vi.runAllTimersAsync();

        await assertion;
        expect(create.mock.calls.map(([args]) => args.model)).toEqual(['main', 'main', 'main', 'lite']);
    });

    it('does not retry other errors', async () => {
        const create = vi.fn().mockRejectedValue(Object.assign(new Error('bad request'), { status: 400 }));
        await expect(makeService(create).prompt('ocr', 'prompt')).rejects.toThrow('bad request');
        expect(create).toHaveBeenCalledTimes(1);
    });
});
