import { E_RECURRING_INTERVAL } from '../../const/enum.js';

/** Today as YYYY-MM-DD (UTC). */
export function today(): string {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Returns the n-th occurrence after `start` (YYYY-MM-DD). Month/year steps clamp to the
 * last day of the month, but always count from the start date so the 31st doesn't drift.
 */
export function addInterval(start: string, interval: E_RECURRING_INTERVAL, n: number): string {
    const [year, month, day] = start.split('-').map(Number);

    if (interval === E_RECURRING_INTERVAL.WEEKLY) {
        const date = new Date(Date.UTC(year, month - 1, day + 7 * n));
        return date.toISOString().slice(0, 10);
    }

    const monthsToAdd = interval === E_RECURRING_INTERVAL.MONTHLY ? n : 12 * n;
    const targetMonthIndex = month - 1 + monthsToAdd;
    const targetYear = year + Math.floor(targetMonthIndex / 12);
    const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
    const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();

    return new Date(Date.UTC(targetYear, targetMonth, Math.min(day, lastDay))).toISOString().slice(0, 10);
}

/** Converts DD/MM/YYYY (receipt format) to YYYY-MM-DD, or null if it isn't a valid date. */
export function receiptDateToIso(value: string | null | undefined): string | null {
    const match = value?.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
    if (!match) {
        return null;
    }

    const [, dd, mm, yy] = match;
    const year = yy.length === 2 ? 2000 + Number(yy) : Number(yy);
    const iso = `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    const date = new Date(`${iso}T00:00:00Z`);

    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(iso) && year > 2000 ? iso : null;
}
