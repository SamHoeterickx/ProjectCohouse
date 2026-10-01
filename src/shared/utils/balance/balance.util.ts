export interface ITransfer {
    from: string;
    to: string;
    amount: number;
}

/**
 * Turns net balances (positive = should receive, negative = owes) into a
 * minimal-ish list of transfers using a greedy largest-debtor/largest-creditor match.
 */
export function simplifyDebts(balances: Map<string, number>): ITransfer[] {
    const creditors = [...balances]
        .filter(([, amount]) => amount > 0)
        .map(([user, amount]) => ({ user, amount }));
    const debtors = [...balances]
        .filter(([, amount]) => amount < 0)
        .map(([user, amount]) => ({ user, amount: -amount }));

    const sortDesc = (a: { user: string; amount: number }, b: { user: string; amount: number }) =>
        b.amount - a.amount || a.user.localeCompare(b.user);

    const transfers: ITransfer[] = [];

    while (creditors.length > 0 && debtors.length > 0) {
        creditors.sort(sortDesc);
        debtors.sort(sortDesc);

        const creditor = creditors[0];
        const debtor = debtors[0];
        const amount = Math.min(creditor.amount, debtor.amount);

        transfers.push({ from: debtor.user, to: creditor.user, amount });

        creditor.amount -= amount;
        debtor.amount -= amount;

        if (creditor.amount === 0) creditors.shift();
        if (debtor.amount === 0) debtors.shift();
    }

    return transfers;
}
