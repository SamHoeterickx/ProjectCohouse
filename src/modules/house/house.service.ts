import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { House } from './entity/house.entity.js';
import { Repository } from 'typeorm';
import { CreateHouseDto } from './dto/create-house.dto.js';
import { HouseUser } from '../user/entity/house_user.entity.js';
import { E_USER_ROLES } from '../../shared/const/enum.js';
import { randomBytes } from 'crypto';
import { LENGTH_INVITE_CODE } from '../../shared/const/house.const.js';
import { UserService } from '../user/user.service.js';

@Injectable()
export class HouseService {
    constructor(
        private readonly userService: UserService,
        @InjectRepository(House) private readonly houseRepository: Repository<House>,
        @InjectRepository(HouseUser) private readonly houseUserRepository: Repository<HouseUser>,
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
            data: user.houses,
        }
    }

    public async getHouse(houseUuid: string, userUuid: string){
        const house = await this.findHouseByUuid(houseUuid);
        if(!house){
            throw new NotFoundException(`No house found with uuid: ${houseUuid}`);
        }

        const isMember = house.memberships.some(
            (membership) => membership.user.uuid === userUuid
        );
        if(!isMember){
            throw new NotFoundException(`No house found with uuid: ${houseUuid}`);
        }

        return {
            message: 'House retrieved successfully',
            data: house,
        }
    }

    public async create(houseDto: CreateHouseDto, userUuid: string){
        const { name, adress } = houseDto;

        const house = this.houseRepository.create({
            name,
            adress,
            inviteCode: randomBytes(LENGTH_INVITE_CODE).toString('hex')
        });
        const savedHouse = await this.houseRepository.save(house);

        const houseAdmin = this.houseUserRepository.create({
            user: { uuid: userUuid },
            house: savedHouse,
            role: E_USER_ROLES.ADMIN
        });

        await this.houseUserRepository.save(houseAdmin);

        return {
            message: 'House created successfully',
            data: {
                inviteCode: savedHouse.inviteCode
            }
        }
    }

    public async join(inviteCode: string, userUuid: string){

        const excstingHouse = await this.findHouseByInviteCode(inviteCode);
        if(!excstingHouse){
            throw new NotFoundException(`No house found with invite code: ${inviteCode}`);
        }

        const userAlreadyInHouse = excstingHouse.memberships.some(
            (membership) => membership.user.uuid === userUuid
        );
        if(userAlreadyInHouse){
            throw new ConflictException('User already joined this house');
        }

        const newHouseUser = this.houseUserRepository.create({
            user: { uuid: userUuid },
            house: excstingHouse,
            role: E_USER_ROLES.MEMBER
        });

        await this.houseUserRepository.save(newHouseUser);

        return {
            message: 'House successfully joined',
        }

    }

    public async regenerate(houseUuid: string, userUuid: string){
        const existingHouse = await this.findHouseByUuid(houseUuid);
        if(!existingHouse){
            throw new ConflictException(`No house found with uuid: ${houseUuid}`);
        }

        const isAdmin = existingHouse.memberships.some(
            (membership) => (membership.user.uuid === userUuid)
        );
        if(!isAdmin){
            throw new ConflictException('Only the admin can create an invite code');
        }

        const newInviteCode = randomBytes(LENGTH_INVITE_CODE).toString('hex');
        await this.houseRepository.update(houseUuid, { inviteCode: newInviteCode });

        return {
            message: 'New invite code created successfully',
            data: {
                inviteCode: newInviteCode
            }
        }
    }

    private async findHouseByUuid(uuid: string){
        return await this.houseRepository.findOne({
            where: { uuid },
            relations: {
                memberships: {
                    user: true
                }
            }
        })
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
