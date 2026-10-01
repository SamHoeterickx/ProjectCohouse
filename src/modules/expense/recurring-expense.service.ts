import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';

// ___ENTITY___
import { RecurringExpense } from '../recurring-expense/entity/recurring-expense.entity.js';

// ___SERVICE___
import { ExpenseService } from './expense.service.js';
import { ActivityService } from '../activity/activity.service.js';
import { HouseAccessService } from '../../shared/utils/house-access/house-access.service.js';

// ___DTO___
import { CreateRecurringExpenseDto } from '../recurring-expense/dto/create-recurring-expense.dto.js';

// ___UTILS___
import { buildSplits } from './expense-split.builder.js';
import { addInterval, today } from '../../shared/utils/date/date.util.js';

// ___CONST___
import { E_ACTIVITY_ACTION, E_EXPENSE_CATEGORY } from '../../shared/const/enum.js';

// ___MAPPER___
import { toPublicUser } from '../../shared/mappers/user.mapper.js';

/** Safety net so a start date far in the past can't generate thousands of expenses in one request. */
const MAX_OCCURRENCES_PER_RUN = 120;

@Injectable()
export class RecurringExpenseService {

    private readonly logger = new Logger(RecurringExpenseService.name);

    constructor(
        @InjectRepository(RecurringExpense) private readonly recurringRepository: Repository<RecurringExpense>,
        private readonly expenseService: ExpenseService,
        private readonly activityService: ActivityService,
        private readonly houseAccessService: HouseAccessService,
    ) {}

    public async list(houseUuid: string) {
        const recurring = await this.recurringRepository.find({
            where: { house: { uuid: houseUuid } },
            relations: { paid_by: true, created_by: true },
            order: { next_date: 'ASC' },
        });

        return {
            message: 'Recurring expenses retrieved successfully',
            data: recurring.map((item) => this.map(item)),
        };
    }

    public async create(houseUuid: string, dto: CreateRecurringExpenseDto, userUuid: string) {
        await this.validate(houseUuid, dto);

        const saved = await this.recurringRepository.save(this.recurringRepository.create({
            ...this.toColumns(dto),
            house: { uuid: houseUuid },
            created_by: { uuid: userUuid },
            occurrences: 0,
            next_date: dto.start_date,
        }));

        await this.activityService.log(houseUuid, userUuid, E_ACTIVITY_ACTION.RECURRING_CREATED, saved.uuid, { title: saved.title });
        await this.processDue(houseUuid);

        return {
            message: 'Recurring expense created successfully',
            data: this.map(await this.findOneOrFail(houseUuid, saved.uuid)),
        };
    }

    /** Changes apply to future occurrences only; already generated expenses stay untouched. */
    public async update(houseUuid: string, uuid: string, dto: CreateRecurringExpenseDto, userUuid: string) {
        const existing = await this.findOneOrFail(houseUuid, uuid);
        await this.validate(houseUuid, dto);

        const scheduleChanged = existing.start_date !== dto.start_date || existing.interval !== dto.interval;

        await this.recurringRepository.save({
            ...existing,
            ...this.toColumns(dto),
            ...(scheduleChanged ? { occurrences: 0, next_date: dto.start_date } : {}),
        });

        await this.activityService.log(houseUuid, userUuid, E_ACTIVITY_ACTION.RECURRING_UPDATED, uuid, { title: dto.title });
        await this.processDue(houseUuid);

        return {
            message: 'Recurring expense updated successfully',
            data: this.map(await this.findOneOrFail(houseUuid, uuid)),
        };
    }

    public async remove(houseUuid: string, uuid: string, userUuid: string) {
        const existing = await this.findOneOrFail(houseUuid, uuid);

        await this.recurringRepository.delete(existing.uuid);
        await this.activityService.log(houseUuid, userUuid, E_ACTIVITY_ACTION.RECURRING_DELETED, uuid, { title: existing.title });

        return {
            message: 'Recurring expense deleted successfully',
        };
    }

    /**
     * Generates expenses for every occurrence up to today. Each occurrence is claimed with a
     * conditional update first, so concurrent requests never create the same expense twice.
     */
    public async processDue(houseUuid: string) {
        const now = today();
        const due = await this.recurringRepository.find({
            where: { house: { uuid: houseUuid }, active: true, next_date: LessThanOrEqual(now) },
            relations: { paid_by: true, created_by: true },
        });

        for (const recurring of due) {
            for (let run = 0; run < MAX_OCCURRENCES_PER_RUN; run++) {
                const date = recurring.next_date;

                if (date > now || (recurring.end_date && date > recurring.end_date)) {
                    break;
                }

                const occurrences = recurring.occurrences + 1;
                const nextDate = addInterval(recurring.start_date, recurring.interval, occurrences);

                const claim = await this.recurringRepository.update(
                    { uuid: recurring.uuid, occurrences: recurring.occurrences },
                    { occurrences, next_date: nextDate },
                );
                if (!claim.affected) {
                    break;
                }

                recurring.occurrences = occurrences;
                recurring.next_date = nextDate;

                try {
                    await this.expenseService.create(houseUuid, {
                        title: recurring.title,
                        category: recurring.category,
                        notes: recurring.notes ?? undefined,
                        amount_in_cents: recurring.amount_in_cents,
                        date,
                        paid_by: recurring.paid_by.uuid,
                        split_type: recurring.split_type,
                        participants: recurring.participants.map((participant) => ({
                            user_uuid: participant.userUuid,
                            shares: participant.shares,
                            amount_in_cents: participant.amount_in_cents,
                        })),
                    }, recurring.created_by.uuid, recurring.uuid);
                } catch (error) {
                    // A participant probably left the house; pause instead of failing every request.
                    this.logger.warn(`Pausing recurring expense ${recurring.uuid}: ${error instanceof Error ? error.message : error}`);
                    await this.recurringRepository.update(recurring.uuid, { active: false });
                    break;
                }
            }
        }
    }

    private async validate(houseUuid: string, dto: CreateRecurringExpenseDto) {
        if (dto.end_date && dto.end_date < dto.start_date) {
            throw new BadRequestException('end_date must be on or after start_date');
        }

        await this.houseAccessService.assertMembers(houseUuid, [
            dto.paid_by,
            ...dto.participants.map((participant) => participant.user_uuid),
        ]);

        buildSplits(dto.split_type, dto.amount_in_cents, dto.amount_in_cents, dto.participants);
    }

    private toColumns(dto: CreateRecurringExpenseDto) {
        return {
            title: dto.title,
            category: dto.category ?? E_EXPENSE_CATEGORY.OTHER,
            notes: dto.notes ?? null,
            amount_in_cents: dto.amount_in_cents,
            paid_by: { uuid: dto.paid_by },
            split_type: dto.split_type,
            participants: dto.participants.map((participant) => ({
                userUuid: participant.user_uuid,
                shares: participant.shares,
                amount_in_cents: participant.amount_in_cents,
            })),
            interval: dto.interval,
            start_date: dto.start_date,
            end_date: dto.end_date ?? null,
            active: dto.active ?? true,
        };
    }

    private async findOneOrFail(houseUuid: string, uuid: string) {
        const recurring = await this.recurringRepository.findOne({
            where: { uuid, house: { uuid: houseUuid } },
            relations: { paid_by: true, created_by: true },
        });

        if (!recurring) {
            throw new NotFoundException(`No recurring expense found with uuid: ${uuid}`);
        }

        return recurring;
    }

    private map(recurring: RecurringExpense) {
        return {
            uuid: recurring.uuid,
            title: recurring.title,
            category: recurring.category,
            notes: recurring.notes,
            amount_in_cents: recurring.amount_in_cents,
            split_type: recurring.split_type,
            participants: recurring.participants.map((participant) => ({
                user_uuid: participant.userUuid,
                shares: participant.shares,
                amount_in_cents: participant.amount_in_cents,
            })),
            interval: recurring.interval,
            start_date: recurring.start_date,
            end_date: recurring.end_date,
            next_date: recurring.next_date,
            active: recurring.active,
            paid_by: toPublicUser(recurring.paid_by),
            created_by: toPublicUser(recurring.created_by),
            created_at: recurring.created_at,
            updated_at: recurring.updated_at,
        };
    }
}
