import { BadRequestException } from '@nestjs/common';
import { buildSplits } from './expense-split.builder.js';
import { E_SPLIT_TYPE } from '../../shared/const/enum.js';

describe('buildSplits', () => {
    it('splits equally', () => {
        const splits = buildSplits(E_SPLIT_TYPE.EQUAL, 1000, 1000, [{ user_uuid: 'b' }, { user_uuid: 'a' }, { user_uuid: 'c' }]);
        expect(splits.map((split) => split.amount_in_cents)).toEqual([334, 333, 333]);
    });

    it('validates exact amounts', () => {
        expect(() => buildSplits(E_SPLIT_TYPE.EXACT, 1000, 1000, [
            { user_uuid: 'a', amount_in_cents: 500 },
            { user_uuid: 'b', amount_in_cents: 400 },
        ])).toThrow(BadRequestException);
    });

    it('converts exact amounts to the house currency', () => {
        const splits = buildSplits(E_SPLIT_TYPE.EXACT, 1000, 2000, [
            { user_uuid: 'a', amount_in_cents: 750 },
            { user_uuid: 'b', amount_in_cents: 250 },
        ]);
        expect(splits.map((split) => split.amount_in_cents)).toEqual([1500, 500]);
    });

    it('requires items for the items split', () => {
        expect(() => buildSplits(E_SPLIT_TYPE.ITEMS, 1000, 1000)).toThrow(BadRequestException);
    });
});
