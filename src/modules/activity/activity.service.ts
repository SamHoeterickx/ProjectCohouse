import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// ___ENTITY___
import { Activity } from './entity/activity.entity.js';

// ___CONST___
import { E_ACTIVITY_ACTION } from '../../shared/const/enum.js';

// ___MAPPER___
import { toPublicUser } from '../../shared/mappers/user.mapper.js';

@Injectable()
export class ActivityService {

    constructor(
        @InjectRepository(Activity) private readonly activityRepository: Repository<Activity>,
    ) {}

    public async log(
        houseUuid: string,
        userUuid: string | null,
        action: E_ACTIVITY_ACTION,
        entityUuid?: string | null,
        payload?: Record<string, unknown>,
    ) {
        await this.activityRepository.save(this.activityRepository.create({
            house: { uuid: houseUuid },
            user: userUuid ? { uuid: userUuid } : null,
            action,
            entity_uuid: entityUuid ?? null,
            payload: payload ?? null,
        }));
    }

    public async list(houseUuid: string, page: number, limit: number) {
        const [activities, total] = await this.activityRepository.findAndCount({
            where: { house: { uuid: houseUuid } },
            relations: { user: true },
            order: { created_at: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            message: 'Activity retrieved successfully',
            data: {
                items: activities.map((activity) => ({
                    uuid: activity.uuid,
                    action: activity.action,
                    entity_uuid: activity.entity_uuid,
                    payload: activity.payload,
                    user: toPublicUser(activity.user),
                    created_at: activity.created_at,
                })),
                total,
                page,
                limit,
            },
        };
    }
}
