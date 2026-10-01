import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, EntityManager, Repository } from 'typeorm';

// ___ENTITY___
import { Expense } from './entity/expense.entity.js';
import { ExpenseItem } from './entity/expense-item.entity.js';
import { ExpenseSplit } from './entity/expense-split.entity.js';
import { House } from '../house/entity/house.entity.js';

// ___SERVICE___
import { HouseAccessService } from '../../shared/utils/house-access/house-access.service.js';
import { ActivityService } from '../activity/activity.service.js';

// ___DTO___
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { ExpenseFilterDto } from './dto/expense-filter.dto.js';

// ___UTILS___
import { buildSplits } from './expense-split.builder.js';

// ___CONST___
import { E_ACTIVITY_ACTION, E_SPLIT_TYPE } from '../../shared/const/enum.js';

// ___MAPPER___
import { toPublicUser } from '../../shared/mappers/user.mapper.js';

@Injectable()
export class ExpenseService {

    constructor(
        @InjectRepository(Expense) private readonly expenseRepository: Repository<Expense>,
        @InjectDataSource() private readonly dataSource: DataSource,
        private readonly houseAccessService: HouseAccessService,
        private readonly activityService: ActivityService,
    ) {}

    public async create(houseUuid: string, dto: CreateExpenseDto, userUuid: string, recurringExpenseUuid?: string) {
        const expense = await this.dataSource.transaction(async (manager) => {
            const entity = manager.create(Expense, {
                house: { uuid: houseUuid },
                added_by: { uuid: userUuid },
                recurring_expense: recurringExpenseUuid ? { uuid: recurringExpenseUuid } : null,
            });

            return this.persist(manager, entity, houseUuid, dto);
        });

        await this.activityService.log(houseUuid, recurringExpenseUuid ? null : userUuid, E_ACTIVITY_ACTION.EXPENSE_CREATED, expense.uuid, {
            title: expense.title,
            amount_in_cents: expense.amount_in_cents,
            recurring: Boolean(recurringExpenseUuid),
        });

        return {
            message: 'Expense created successfully',
            data: await this.findOneMapped(houseUuid, expense.uuid),
        };
    }

    public async update(houseUuid: string, expenseUuid: string, dto: CreateExpenseDto, userUuid: string) {
        const existing = await this.findOneOrFail(houseUuid, expenseUuid);

        await this.dataSource.transaction(async (manager) => {
            await manager.delete(ExpenseItem, { expense: { uuid: existing.uuid } });
            await manager.delete(ExpenseSplit, { expense: { uuid: existing.uuid } });

            const entity = manager.create(Expense, {
                uuid: existing.uuid,
                house: { uuid: houseUuid },
                added_by: existing.added_by,
                recurring_expense: existing.recurring_expense,
            });

            await this.persist(manager, entity, houseUuid, dto);
        });

        await this.activityService.log(houseUuid, userUuid, E_ACTIVITY_ACTION.EXPENSE_UPDATED, expenseUuid, {
            title: dto.title,
            amount_in_cents: dto.amount_in_cents,
        });

        return {
            message: 'Expense updated successfully',
            data: await this.findOneMapped(houseUuid, expenseUuid),
        };
    }

    public async remove(houseUuid: string, expenseUuid: string, userUuid: string) {
        const expense = await this.findOneOrFail(houseUuid, expenseUuid);

        await this.expenseRepository.delete(expense.uuid);

        await this.activityService.log(houseUuid, userUuid, E_ACTIVITY_ACTION.EXPENSE_DELETED, expenseUuid, {
            title: expense.title,
            amount_in_cents: expense.amount_in_cents,
        });

        return {
            message: 'Expense deleted successfully',
        };
    }

    public async getOne(houseUuid: string, expenseUuid: string) {
        return {
            message: 'Expense retrieved successfully',
            data: await this.findOneMapped(houseUuid, expenseUuid),
        };
    }

    public async list(houseUuid: string, filter: ExpenseFilterDto) {
        const [expenses, total] = await this.buildFilterQuery(houseUuid, filter)
            .skip((filter.page - 1) * filter.limit)
            .take(filter.limit)
            .getManyAndCount();

        return {
            message: 'Expenses retrieved successfully',
            data: {
                items: expenses.map((expense) => this.mapExpense(expense)),
                total,
                page: filter.page,
                limit: filter.limit,
            },
        };
    }

    public async exportCsv(houseUuid: string, filter: ExpenseFilterDto) {
        const members = await this.houseAccessService.getMembers(houseUuid);
        const expenses = await this.buildFilterQuery(houseUuid, filter).getMany();

        const memberUsers = new Map(members.map((member) => [member.user.uuid, member.user.name]));
        for (const expense of expenses) {
            for (const split of expense.splits) {
                if (!memberUsers.has(split.user.uuid)) {
                    memberUsers.set(split.user.uuid, split.user.name);
                }
            }
        }

        const userColumns = [...memberUsers];
        const header = [
            'date', 'title', 'store', 'category', 'paid_by', 'amount', 'currency',
            'original_amount', 'original_currency', 'notes',
            ...userColumns.map(([, name]) => name),
        ];

        const rows = expenses.map((expense) => {
            const shares = new Map(expense.splits.map((split) => [split.user.uuid, split.amount_in_cents]));

            return [
                expense.date,
                expense.title,
                expense.store ?? '',
                expense.category,
                expense.paid_by.name,
                formatCents(expense.amount_in_cents),
                expense.house.currency,
                expense.original_amount_in_cents !== null ? formatCents(expense.original_amount_in_cents) : '',
                expense.original_amount_in_cents !== null ? expense.currency : '',
                expense.notes ?? '',
                ...userColumns.map(([uuid]) => formatCents(shares.get(uuid) ?? 0)),
            ];
        });

        return [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
    }

    private async persist(manager: EntityManager, entity: Expense, houseUuid: string, dto: CreateExpenseDto) {
        const { currency: houseCurrency } = await manager.findOneByOrFail(House, { uuid: houseUuid });

        const currency = (dto.currency ?? houseCurrency).toUpperCase();
        const isForeign = currency !== houseCurrency;

        if (isForeign && !dto.exchange_rate) {
            throw new BadRequestException(`exchange_rate is required when currency differs from the house currency (${houseCurrency})`);
        }

        const houseTotal = isForeign
            ? Math.round(dto.amount_in_cents * dto.exchange_rate!)
            : dto.amount_in_cents;

        const items = dto.items ?? [];
        const participants = dto.split_type === E_SPLIT_TYPE.ITEMS ? [] : (dto.participants ?? []);

        await this.houseAccessService.assertMembers(houseUuid, [
            dto.paid_by,
            ...participants.map((participant) => participant.user_uuid),
            ...items.flatMap((item) => item.assigned_to),
        ]);

        const splits = buildSplits(dto.split_type, dto.amount_in_cents, houseTotal, participants, items);

        Object.assign(entity, {
            title: dto.title,
            store: dto.store ?? null,
            category: dto.category ?? entity.category,
            notes: dto.notes ?? null,
            amount_in_cents: houseTotal,
            currency,
            original_amount_in_cents: isForeign ? dto.amount_in_cents : null,
            exchange_rate: isForeign ? String(dto.exchange_rate) : null,
            date: dto.date,
            split_type: dto.split_type,
            receipt_url: dto.receipt_url ?? null,
            paid_by: { uuid: dto.paid_by },
            items: items.map((item) => manager.create(ExpenseItem, {
                name: item.name,
                amount: item.amount,
                price_per_unit: item.price_per_unit,
                discount_in_cents: item.discount_in_cents ?? 0,
                price: item.price,
                assigned_to: [...new Set(item.assigned_to)].map((uuid) => ({ uuid })),
            })),
            splits: splits.map((split) => manager.create(ExpenseSplit, {
                user: { uuid: split.user_uuid },
                amount_in_cents: split.amount_in_cents,
                shares: split.shares,
            })),
        });

        return manager.save(Expense, entity);
    }

    private buildFilterQuery(houseUuid: string, filter: ExpenseFilterDto) {
        const query = this.expenseRepository.createQueryBuilder('expense')
            .leftJoinAndSelect('expense.house', 'house')
            .leftJoinAndSelect('expense.paid_by', 'paid_by')
            .leftJoinAndSelect('expense.added_by', 'added_by')
            .leftJoinAndSelect('expense.recurring_expense', 'recurring_expense')
            .leftJoinAndSelect('expense.splits', 'split')
            .leftJoinAndSelect('split.user', 'split_user')
            .where('house.uuid = :houseUuid', { houseUuid })
            .orderBy('expense.date', 'DESC')
            .addOrderBy('expense.created_at', 'DESC');

        if (filter.category) {
            query.andWhere('expense.category = :category', { category: filter.category });
        }
        if (filter.paid_by) {
            query.andWhere('paid_by.uuid = :paidBy', { paidBy: filter.paid_by });
        }
        if (filter.participant) {
            query.andWhere(
                `EXISTS (SELECT 1 FROM "expense_split" "es" WHERE "es"."expenseUuid" = "expense"."uuid" AND "es"."userUuid" = :participant)`,
                { participant: filter.participant },
            );
        }
        if (filter.from) {
            query.andWhere('expense.date >= :from', { from: filter.from });
        }
        if (filter.to) {
            query.andWhere('expense.date <= :to', { to: filter.to });
        }
        if (filter.search) {
            const search = `%${filter.search.replace(/[%_\\]/g, '\\$&')}%`;
            query.andWhere(new Brackets((qb) => {
                qb.where('expense.title ILIKE :search', { search })
                    .orWhere('expense.store ILIKE :search', { search })
                    .orWhere('expense.notes ILIKE :search', { search });
            }));
        }

        return query;
    }

    private async findOneOrFail(houseUuid: string, expenseUuid: string) {
        const expense = await this.expenseRepository.findOne({
            where: { uuid: expenseUuid, house: { uuid: houseUuid } },
            relations: {
                paid_by: true,
                added_by: true,
                recurring_expense: true,
                items: { assigned_to: true },
                splits: { user: true },
            },
        });

        if (!expense) {
            throw new NotFoundException(`No expense found with uuid: ${expenseUuid}`);
        }

        return expense;
    }

    private async findOneMapped(houseUuid: string, expenseUuid: string) {
        return this.mapExpense(await this.findOneOrFail(houseUuid, expenseUuid));
    }

    private mapExpense(expense: Expense) {
        return {
            uuid: expense.uuid,
            title: expense.title,
            store: expense.store,
            category: expense.category,
            notes: expense.notes,
            amount_in_cents: expense.amount_in_cents,
            currency: expense.currency,
            original_amount_in_cents: expense.original_amount_in_cents,
            exchange_rate: expense.exchange_rate !== null ? Number(expense.exchange_rate) : null,
            date: expense.date,
            split_type: expense.split_type,
            receipt_url: expense.receipt_url,
            paid_by: toPublicUser(expense.paid_by),
            added_by: toPublicUser(expense.added_by),
            recurring_expense_uuid: expense.recurring_expense?.uuid ?? null,
            items: expense.items?.map((item) => ({
                uuid: item.uuid,
                name: item.name,
                amount: item.amount,
                price_per_unit: item.price_per_unit,
                discount_in_cents: item.discount_in_cents,
                price: item.price,
                assigned_to: item.assigned_to.map(toPublicUser),
            })),
            splits: expense.splits?.map((split) => ({
                user: toPublicUser(split.user),
                amount_in_cents: split.amount_in_cents,
                shares: split.shares,
            })),
            created_at: expense.created_at,
            updated_at: expense.updated_at,
        };
    }
}

function formatCents(cents: number) {
    return (cents / 100).toFixed(2);
}

function escapeCsv(value: string) {
    const safe = /^[=+\-@\t\r]/.test(value) && !/^-?\d/.test(value) ? `'${value}` : value;
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}
