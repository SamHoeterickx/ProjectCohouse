import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

// ___ENTITY___
import { Expense } from '../expense/entity/expense.entity.js';
import { ExpenseSplit } from '../expense/entity/expense-split.entity.js';
import { Settlement } from '../settlement/entity/settlement.entity.js';
import { User } from '../user/entity/user.entity.js';

// ___SERVICE___
import { HouseAccessService } from '../../shared/utils/house-access/house-access.service.js';
import { RecurringExpenseService } from '../expense/recurring-expense.service.js';

// ___UTILS___
import { simplifyDebts } from '../../shared/utils/balance/balance.util.js';

interface IUserTotals {
    paid: number;
    share: number;
    sent: number;
    received: number;
}

@Injectable()
export class BalanceService {

    constructor(
        @InjectRepository(Expense) private readonly expenseRepository: Repository<Expense>,
        @InjectRepository(ExpenseSplit) private readonly splitRepository: Repository<ExpenseSplit>,
        @InjectRepository(Settlement) private readonly settlementRepository: Repository<Settlement>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly houseAccessService: HouseAccessService,
        private readonly recurringExpenseService: RecurringExpenseService,
    ) {}

    public async getBalances(houseUuid: string) {
        await this.recurringExpenseService.processDue(houseUuid);

        const [totals, members] = await Promise.all([
            this.computeTotals(houseUuid),
            this.houseAccessService.getMembers(houseUuid),
        ]);

        // Current members always show up; former members only while they still have a balance.
        for (const member of members) {
            if (!totals.has(member.user.uuid)) {
                totals.set(member.user.uuid, { paid: 0, share: 0, sent: 0, received: 0 });
            }
        }

        const memberUuids = new Set(members.map((member) => member.user.uuid));
        const users = await this.userRepository.find({
            where: { uuid: In([...totals.keys()]) },
            select: { uuid: true, name: true },
        });
        const names = new Map(users.map((user) => [user.uuid, user.name]));

        const net = new Map([...totals].map(([uuid, total]) => [uuid, netBalance(total)]));

        const balances = [...totals]
            .filter(([uuid]) => memberUuids.has(uuid) || net.get(uuid) !== 0)
            .map(([uuid, total]) => ({
                user: { uuid, name: names.get(uuid) ?? 'Unknown' },
                is_member: memberUuids.has(uuid),
                paid_in_cents: total.paid,
                share_in_cents: total.share,
                settlements_sent_in_cents: total.sent,
                settlements_received_in_cents: total.received,
                balance_in_cents: net.get(uuid)!,
            }))
            .sort((a, b) => b.balance_in_cents - a.balance_in_cents);

        const transfers = simplifyDebts(net).map((transfer) => ({
            from: { uuid: transfer.from, name: names.get(transfer.from) ?? 'Unknown' },
            to: { uuid: transfer.to, name: names.get(transfer.to) ?? 'Unknown' },
            amount_in_cents: transfer.amount,
        }));

        return {
            message: 'Balances retrieved successfully',
            data: {
                total_spent_in_cents: balances.reduce((sum, balance) => sum + balance.paid_in_cents, 0),
                balances,
                suggested_transfers: transfers,
            },
        };
    }

    /** Net balance of one user: positive = should receive, negative = owes. */
    public async getUserBalance(houseUuid: string, userUuid: string) {
        const totals = await this.computeTotals(houseUuid);
        const total = totals.get(userUuid);

        return total ? netBalance(total) : 0;
    }

    /** True when nobody in the house owes anything. */
    public async isHouseSettled(houseUuid: string) {
        const totals = await this.computeTotals(houseUuid);

        return [...totals.values()].every((total) => netBalance(total) === 0);
    }

    private async computeTotals(houseUuid: string) {
        const [paid, share, sent, received] = await Promise.all([
            this.expenseRepository.createQueryBuilder('expense')
                .select('"expense"."paidByUuid"', 'user')
                .addSelect('SUM("expense"."amount_in_cents")', 'amount')
                .where('"expense"."houseUuid" = :houseUuid', { houseUuid })
                .groupBy('"expense"."paidByUuid"')
                .getRawMany<{ user: string; amount: string }>(),
            this.splitRepository.createQueryBuilder('split')
                .innerJoin('split.expense', 'expense')
                .select('"split"."userUuid"', 'user')
                .addSelect('SUM("split"."amount_in_cents")', 'amount')
                .where('"expense"."houseUuid" = :houseUuid', { houseUuid })
                .groupBy('"split"."userUuid"')
                .getRawMany<{ user: string; amount: string }>(),
            this.settlementRepository.createQueryBuilder('settlement')
                .select('"settlement"."fromUserUuid"', 'user')
                .addSelect('SUM("settlement"."amount_in_cents")', 'amount')
                .where('"settlement"."houseUuid" = :houseUuid', { houseUuid })
                .groupBy('"settlement"."fromUserUuid"')
                .getRawMany<{ user: string; amount: string }>(),
            this.settlementRepository.createQueryBuilder('settlement')
                .select('"settlement"."toUserUuid"', 'user')
                .addSelect('SUM("settlement"."amount_in_cents")', 'amount')
                .where('"settlement"."houseUuid" = :houseUuid', { houseUuid })
                .groupBy('"settlement"."toUserUuid"')
                .getRawMany<{ user: string; amount: string }>(),
        ]);

        const totals = new Map<string, IUserTotals>();
        const add = (rows: { user: string; amount: string }[], key: keyof IUserTotals) => {
            for (const row of rows) {
                const total = totals.get(row.user) ?? { paid: 0, share: 0, sent: 0, received: 0 };
                total[key] += Number(row.amount);
                totals.set(row.user, total);
            }
        };

        add(paid, 'paid');
        add(share, 'share');
        add(sent, 'sent');
        add(received, 'received');

        return totals;
    }
}

function netBalance(total: IUserTotals) {
    return total.paid - total.share + total.sent - total.received;
}
