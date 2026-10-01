import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// ___ENTITY___
import { Settlement } from './entity/settlement.entity.js';

// ___SERVICE___
import { ActivityService } from '../activity/activity.service.js';
import { HouseAccessService } from '../../shared/utils/house-access/house-access.service.js';

// ___DTO___
import { CreateSettlementDto } from './dto/create-settlement.dto.js';
import { PaginationDto } from '../../shared/dto/pagination.dto.js';

// ___CONST___
import { E_ACTIVITY_ACTION } from '../../shared/const/enum.js';

// ___MAPPER___
import { toPublicUser } from '../../shared/mappers/user.mapper.js';

@Injectable()
export class SettlementService {

    constructor(
        @InjectRepository(Settlement) private readonly settlementRepository: Repository<Settlement>,
        private readonly activityService: ActivityService,
        private readonly houseAccessService: HouseAccessService,
    ) {}

    public async list(houseUuid: string, pagination: PaginationDto) {
        const [settlements, total] = await this.settlementRepository.findAndCount({
            where: { house: { uuid: houseUuid } },
            relations: { from_user: true, to_user: true, added_by: true },
            order: { date: 'DESC', created_at: 'DESC' },
            skip: (pagination.page - 1) * pagination.limit,
            take: pagination.limit,
        });

        return {
            message: 'Settlements retrieved successfully',
            data: {
                items: settlements.map((settlement) => this.map(settlement)),
                total,
                page: pagination.page,
                limit: pagination.limit,
            },
        };
    }

    public async create(houseUuid: string, dto: CreateSettlementDto, userUuid: string) {
        if (dto.from_user === dto.to_user) {
            throw new BadRequestException('from_user and to_user must be different');
        }

        await this.houseAccessService.assertMembers(houseUuid, [dto.from_user, dto.to_user]);

        const saved = await this.settlementRepository.save(this.settlementRepository.create({
            house: { uuid: houseUuid },
            from_user: { uuid: dto.from_user },
            to_user: { uuid: dto.to_user },
            amount_in_cents: dto.amount_in_cents,
            date: dto.date,
            notes: dto.notes ?? null,
            added_by: { uuid: userUuid },
        }));

        await this.activityService.log(houseUuid, userUuid, E_ACTIVITY_ACTION.SETTLEMENT_CREATED, saved.uuid, {
            from_user: dto.from_user,
            to_user: dto.to_user,
            amount_in_cents: dto.amount_in_cents,
        });

        return {
            message: 'Settlement created successfully',
            data: this.map(await this.findOneOrFail(houseUuid, saved.uuid)),
        };
    }

    public async remove(houseUuid: string, uuid: string, userUuid: string) {
        const settlement = await this.findOneOrFail(houseUuid, uuid);

        await this.settlementRepository.delete(settlement.uuid);

        await this.activityService.log(houseUuid, userUuid, E_ACTIVITY_ACTION.SETTLEMENT_DELETED, uuid, {
            from_user: settlement.from_user.uuid,
            to_user: settlement.to_user.uuid,
            amount_in_cents: settlement.amount_in_cents,
        });

        return {
            message: 'Settlement deleted successfully',
        };
    }

    private async findOneOrFail(houseUuid: string, uuid: string) {
        const settlement = await this.settlementRepository.findOne({
            where: { uuid, house: { uuid: houseUuid } },
            relations: { from_user: true, to_user: true, added_by: true },
        });

        if (!settlement) {
            throw new NotFoundException(`No settlement found with uuid: ${uuid}`);
        }

        return settlement;
    }

    private map(settlement: Settlement) {
        return {
            uuid: settlement.uuid,
            from_user: toPublicUser(settlement.from_user),
            to_user: toPublicUser(settlement.to_user),
            amount_in_cents: settlement.amount_in_cents,
            date: settlement.date,
            notes: settlement.notes,
            added_by: toPublicUser(settlement.added_by),
            created_at: settlement.created_at,
        };
    }
}
