import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';

// ___ENTITY___
import { House } from './entity/house.entity.js';
import { HouseUser } from '../user/entity/house_user.entity.js';
import { Expense } from '../expense/entity/expense.entity.js';

// ___SERVICE___
import { UserService } from '../user/user.service.js';
import { BalanceService } from '../balance/balance.service.js';
import { ActivityService } from '../activity/activity.service.js';
import { HouseAccessService } from '../../shared/utils/house-access/house-access.service.js';

// ___DTO___
import { CreateHouseDto } from './dto/create-house.dto.js';
import { UpdateHouseDto } from './dto/update-house.dto.js';

// ___CONST___
import { E_ACTIVITY_ACTION, E_USER_ROLES } from '../../shared/const/enum.js';
import { DEFAULT_CURRENCY, LENGTH_INVITE_CODE } from '../../shared/const/house.const.js';

@Injectable()
export class HouseService {
    constructor(
        private readonly userService: UserService,
        private readonly balanceService: BalanceService,
        private readonly activityService: ActivityService,
        private readonly houseAccessService: HouseAccessService,
        @InjectRepository(House) private readonly houseRepository: Repository<House>,
        @InjectRepository(HouseUser) private readonly houseUserRepository: Repository<HouseUser>,
        @InjectRepository(Expense) private readonly expenseRepository: Repository<Expense>,
    ){}

    public async getListOfMyHouses(userUuid: string){
        const user = await this.userService.findUserByUuid(
            userUuid,
            { uuid: true },
            { houseUser: { house: true } }
        );

        if(!user){
            throw new NotFoundException(`No user found with uuid: ${userUuid}`);
        }

        return {
            message: 'Houses retrieved successfully',
            data: user.houseUser.map((membership) => ({
                ...this.mapHouse(membership.house),
                role: membership.role,
            })),
        }
    }

    public async getHouse(houseUuid: string, userUuid: string){
        const membership = await this.houseAccessService.getMembership(houseUuid, userUuid);
        const members = await this.houseAccessService.getMembers(houseUuid);

        return {
            message: 'House retrieved successfully',
            data: {
                ...this.mapHouse(membership.house),
                role: membership.role,
                // Only admins can hand out the invite code.
                inviteCode: membership.role === E_USER_ROLES.ADMIN ? membership.house.inviteCode : undefined,
                members: members.map((member) => ({
                    uuid: member.user.uuid,
                    name: member.user.name,
                    role: member.role,
                })),
            },
        }
    }

    public async create(houseDto: CreateHouseDto, userUuid: string){
        const { name, address, currency } = houseDto;

        const house = this.houseRepository.create({
            name,
            address,
            currency: (currency ?? DEFAULT_CURRENCY).toUpperCase(),
            inviteCode: this.generateInviteCode()
        });
        const savedHouse = await this.houseRepository.save(house);

        const houseAdmin = this.houseUserRepository.create({
            user: { uuid: userUuid },
            house: savedHouse,
            role: E_USER_ROLES.ADMIN
        });

        await this.houseUserRepository.save(houseAdmin);
        await this.activityService.log(savedHouse.uuid, userUuid, E_ACTIVITY_ACTION.HOUSE_CREATED, savedHouse.uuid, { name });

        return {
            message: 'House created successfully',
            data: {
                uuid: savedHouse.uuid,
                inviteCode: savedHouse.inviteCode
            }
        }
    }

    public async update(houseUuid: string, dto: UpdateHouseDto, userUuid: string){
        const { house } = await this.houseAccessService.assertAdmin(houseUuid, userUuid);

        const currency = dto.currency?.toUpperCase();
        if(currency && currency !== house.currency){
            const expenseCount = await this.expenseRepository.count({ where: { house: { uuid: houseUuid } } });
            if(expenseCount > 0){
                throw new ConflictException('The currency can only be changed while the house has no expenses');
            }
        }

        await this.houseRepository.update(houseUuid, {
            ...(dto.name !== undefined ? { name: dto.name } : {}),
            ...(dto.address !== undefined ? { address: dto.address } : {}),
            ...(currency ? { currency } : {}),
        });

        await this.activityService.log(houseUuid, userUuid, E_ACTIVITY_ACTION.HOUSE_UPDATED, houseUuid, { ...dto });

        return {
            message: 'House updated successfully',
            data: this.mapHouse(await this.houseRepository.findOneByOrFail({ uuid: houseUuid })),
        }
    }

    public async remove(houseUuid: string, userUuid: string){
        await this.houseAccessService.assertAdmin(houseUuid, userUuid);

        if(!(await this.balanceService.isHouseSettled(houseUuid))){
            throw new ConflictException('Settle all balances before deleting the house');
        }

        await this.houseRepository.delete(houseUuid);

        return {
            message: 'House deleted successfully',
        }
    }

    public async join(inviteCode: string, userUuid: string){

        const existingHouse = await this.findHouseByInviteCode(inviteCode);
        if(!existingHouse){
            throw new NotFoundException(`No house found with invite code: ${inviteCode}`);
        }

        const userAlreadyInHouse = existingHouse.memberships.some(
            (membership) => membership.user.uuid === userUuid
        );
        if(userAlreadyInHouse){
            throw new ConflictException('User already joined this house');
        }

        const newHouseUser = this.houseUserRepository.create({
            user: { uuid: userUuid },
            house: existingHouse,
            role: E_USER_ROLES.MEMBER
        });

        await this.houseUserRepository.save(newHouseUser);
        await this.activityService.log(existingHouse.uuid, userUuid, E_ACTIVITY_ACTION.MEMBER_JOINED, userUuid);

        return {
            message: 'House successfully joined',
            data: {
                uuid: existingHouse.uuid,
            }
        }

    }

    public async leave(houseUuid: string, userUuid: string){
        const membership = await this.houseAccessService.getMembership(houseUuid, userUuid);
        const members = await this.houseAccessService.getMembers(houseUuid);

        if(members.length === 1){
            return this.remove(houseUuid, userUuid);
        }

        await this.assertBalanceIsZero(houseUuid, userUuid, 'You still have an open balance in this house');
        this.assertNotLastAdmin(members, membership);

        await this.houseUserRepository.delete(membership.uuid);
        await this.activityService.log(houseUuid, userUuid, E_ACTIVITY_ACTION.MEMBER_LEFT, userUuid);

        return {
            message: 'House left successfully',
        }
    }

    public async removeMember(houseUuid: string, memberUuid: string, userUuid: string){
        await this.houseAccessService.assertAdmin(houseUuid, userUuid);

        if(memberUuid === userUuid){
            throw new BadRequestException('Use the leave endpoint to leave a house yourself');
        }

        const target = await this.houseAccessService.getMembership(houseUuid, memberUuid);
        await this.assertBalanceIsZero(houseUuid, memberUuid, 'This member still has an open balance');

        await this.houseUserRepository.delete(target.uuid);
        await this.activityService.log(houseUuid, userUuid, E_ACTIVITY_ACTION.MEMBER_REMOVED, memberUuid);

        return {
            message: 'Member removed successfully',
        }
    }

    public async changeRole(houseUuid: string, memberUuid: string, role: E_USER_ROLES, userUuid: string){
        await this.houseAccessService.assertAdmin(houseUuid, userUuid);

        const target = await this.houseAccessService.getMembership(houseUuid, memberUuid);
        if(target.role === role){
            return { message: 'Role unchanged' };
        }

        if(role === E_USER_ROLES.MEMBER){
            this.assertNotLastAdmin(await this.houseAccessService.getMembers(houseUuid), target);
        }

        await this.houseUserRepository.update(target.uuid, { role });
        await this.activityService.log(houseUuid, userUuid, E_ACTIVITY_ACTION.MEMBER_ROLE_CHANGED, memberUuid, { role });

        return {
            message: 'Role updated successfully',
        }
    }

    public async regenerate(houseUuid: string, userUuid: string){
        await this.houseAccessService.assertAdmin(houseUuid, userUuid);

        const newInviteCode = this.generateInviteCode();
        await this.houseRepository.update(houseUuid, { inviteCode: newInviteCode });

        return {
            message: 'New invite code created successfully',
            data: {
                inviteCode: newInviteCode
            }
        }
    }

    private async assertBalanceIsZero(houseUuid: string, userUuid: string, message: string){
        const balance = await this.balanceService.getUserBalance(houseUuid, userUuid);
        if(balance !== 0){
            throw new ConflictException(`${message} (${(balance / 100).toFixed(2)})`);
        }
    }

    private assertNotLastAdmin(members: HouseUser[], target: HouseUser){
        const admins = members.filter((member) => member.role === E_USER_ROLES.ADMIN);
        if(target.role === E_USER_ROLES.ADMIN && admins.length === 1){
            throw new ConflictException('Promote another member to admin first');
        }
    }

    private generateInviteCode(){
        return randomBytes(LENGTH_INVITE_CODE).toString('hex');
    }

    private mapHouse(house: House){
        return {
            uuid: house.uuid,
            name: house.name,
            address: house.address,
            currency: house.currency,
            created_at: house.created_at,
        };
    }

    private async findHouseByInviteCode(inviteCode: string){
        return await this.houseRepository.findOne({
            where: { inviteCode },
            relations: {
                memberships: {
                    user: true
                }
            }
        })
    }
}
