import { simplifyDebts } from './balance.util.js';

describe('simplifyDebts', () => {
    it('settles all balances', () => {
        const transfers = simplifyDebts(new Map([
            ['a', 3000],
            ['b', -1000],
            ['c', -2000],
        ]));

        expect(transfers).toEqual([
            { from: 'c', to: 'a', amount: 2000 },
            { from: 'b', to: 'a', amount: 1000 },
        ]);
    });

    it('returns nothing when everyone is even', () => {
        expect(simplifyDebts(new Map([['a', 0], ['b', 0]]))).toEqual([]);
    });
});
