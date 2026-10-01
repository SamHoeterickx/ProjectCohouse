/**
 * Distributes `total` cents over `weights` using the largest remainder method.
 * The result always sums exactly to `total`; leftover cents go to the largest
 * fractional remainders, ties broken by input order (deterministic).
 */
export function allocateByWeights(total: number, weights: number[]): number[] {
    if (!Number.isInteger(total) || total < 0) {
        throw new Error('Total must be a non-negative integer amount in cents');
    }
    if (weights.length === 0) {
        throw new Error('At least one participant is required');
    }
    if (weights.some((weight) => weight < 0 || !Number.isFinite(weight))) {
        throw new Error('Weights must be non-negative numbers');
    }

    const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
    if (weightSum === 0) {
        throw new Error('Sum of weights must be greater than 0');
    }

    const raw = weights.map((weight) => (total * weight) / weightSum);
    const result = raw.map(Math.floor);
    let remainder = total - result.reduce((sum, value) => sum + value, 0);

    const order = raw
        .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
        .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

    for (let i = 0; remainder > 0; i = (i + 1) % order.length, remainder--) {
        result[order[i].index] += 1;
    }

    return result;
}

export interface ISplitItemInput {
    price: number;
    userUuids: string[];
}

/**
 * Splits receipt items per user. Each item is divided equally among the users
 * assigned to it, then the per-user subtotals are scaled to `total` so that
 * receipt-level discounts or rounding differences are spread proportionally.
 */
export function splitByItems(total: number, items: ISplitItemInput[]): Map<string, number> {
    const subtotals = new Map<string, number>();

    for (const item of items) {
        if (item.userUuids.length === 0) {
            throw new Error('Every item must be assigned to at least one user');
        }

        const users = [...new Set(item.userUuids)].sort();
        const parts = allocateByWeights(Math.max(item.price, 0), users.map(() => 1));
        users.forEach((userUuid, index) => {
            subtotals.set(userUuid, (subtotals.get(userUuid) ?? 0) + parts[index]);
        });
    }

    const users = [...subtotals.keys()].sort();
    const amounts = allocateByWeights(total, users.map((userUuid) => subtotals.get(userUuid)!));

    return new Map(users.map((userUuid, index) => [userUuid, amounts[index]]));
}
