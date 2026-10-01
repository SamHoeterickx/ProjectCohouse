import { allocateByWeights, splitByItems } from './split.util.js';

describe('allocateByWeights', () => {
    it('splits equally and hands out leftover cents deterministically', () => {
        expect(allocateByWeights(1000, [1, 1, 1])).toEqual([334, 333, 333]);
    });

    it('splits by shares', () => {
        expect(allocateByWeights(1000, [2, 1, 1])).toEqual([500, 250, 250]);
    });

    it('always sums to total', () => {
        const result = allocateByWeights(9999, [3, 7, 11, 13]);
        expect(result.reduce((a, b) => a + b, 0)).toBe(9999);
    });

    it('rejects zero weights', () => {
        expect(() => allocateByWeights(100, [0, 0])).toThrow();
    });
});

describe('splitByItems', () => {
    it('assigns items and spreads receipt discount proportionally', () => {
        const result = splitByItems(900, [
            { price: 600, userUuids: ['a'] },
            { price: 400, userUuids: ['a', 'b'] },
        ]);

        expect(result.get('a')).toBe(720);
        expect(result.get('b')).toBe(180);
    });
});
