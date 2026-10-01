import { addInterval, receiptDateToIso } from './date.util.js';
import { E_RECURRING_INTERVAL } from '../../const/enum.js';

describe('addInterval', () => {
    it('clamps month ends without drifting', () => {
        expect(addInterval('2026-01-31', E_RECURRING_INTERVAL.MONTHLY, 1)).toBe('2026-02-28');
        expect(addInterval('2026-01-31', E_RECURRING_INTERVAL.MONTHLY, 2)).toBe('2026-03-31');
    });

    it('adds weeks and years', () => {
        expect(addInterval('2026-12-28', E_RECURRING_INTERVAL.WEEKLY, 1)).toBe('2027-01-04');
        expect(addInterval('2028-02-29', E_RECURRING_INTERVAL.YEARLY, 1)).toBe('2029-02-28');
    });
});

describe('receiptDateToIso', () => {
    it('parses Belgian receipt dates', () => {
        expect(receiptDateToIso('03/09/2026')).toBe('2026-09-03');
        expect(receiptDateToIso('3.9.26')).toBe('2026-09-03');
    });

    it('rejects fallback and invalid dates', () => {
        expect(receiptDateToIso('01/01/2000')).toBeNull();
        expect(receiptDateToIso('31/02/2026')).toBeNull();
    });
});
