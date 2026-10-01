import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// ___ENTITY___
import { HouseUser } from '../../../modules/user/entity/house_user.entity.js';

// ___CONST___
import { E_USER_ROLES } from '../../const/enum.js';

@Injectable()
export class HouseAccessService {

    constructor(
        @InjectRepository(HouseUser) private readonly houseUserRepository: Repository<HouseUser>,
    ) {}

    /** Returns the membership (with house) or throws 404 so non-members can't probe house ids. */
    public async getMembership(houseUuid: string, userUuid: string) {
        const membership = await this.houseUserRepository.findOne({
            where: {
                house: { uuid: houseUuid },
                user: { uuid: userUuid },
            },
            relations: { house: true },
        });

        if (!membership) {
            throw new NotFoundException(`No house found with uuid: ${houseUuid}`);
        }

        return membership;
    }

    public async assertAdmin(houseUuid: string, userUuid: string) {
        const membership = await this.getMembership(houseUuid, userUuid);

        if (membership.role !== E_USER_ROLES.ADMIN) {
            throw new ForbiddenException('Only a house admin can perform this action');
        }

        return membership;
    }

    public async getMembers(houseUuid: string) {
        return this.houseUserRepository.find({
            where: { house: { uuid: houseUuid } },
            relations: { user: true },
        });
    }

    public async assertMembers(houseUuid: string, userUuids: string[]) {
        const members = await this.getMembers(houseUuid);
        const memberUuids = new Set(members.map((membership) => membership.user.uuid));
        const unknown = [...new Set(userUuids)].filter((uuid) => !memberUuids.has(uuid));

        if (unknown.length > 0) {
            throw new BadRequestException(`Users are not a member of this house: ${unknown.join(', ')}`);
        }
    }
}
