import { Body, ConflictException, Controller, Get, InternalServerErrorException, Param, Post, UseGuards } from '@nestjs/common';

// ___SERVICE___
import { HouseService } from './house.service.js';

// ___DTO___
import { CreateHouseDto } from './dto/create-house.dto.js';

// ___ENTITY___
import { User } from '../user/entity/user.entity.js';

// ___CONST___
import { LENGTH_INVITE_CODE } from '../../shared/const/house.const.js';

// ___GUARDS___
import { JwtAuthGuard } from '../../shared/utils/token/jwt-auth.guard.js';

// ___DECORATOR___
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';


@Controller('house')
@UseGuards(JwtAuthGuard)
export class HouseController {
    constructor(
        private readonly houseService: HouseService
    ){}

    @Get('/myHouses')
    public async getListOfMyHouses(
        @CurrentUser() user: User
    ){
        return await this.houseService.getListOfMyHouses(user.uuid);
    }

    @Get('/:houseUuid')
    public async getHouse(
        @Param('houseUuid') houseUuid: string,
        @CurrentUser() user: User
    ){
        if(houseUuid.length === 0){
            throw new InternalServerErrorException('')
        }

        return await this.houseService.getHouse(houseUuid, user.uuid);
    }

    @Post('/join/:inviteCode')
    public async join(
        @Param('inviteCode') inviteCode: string,
        @CurrentUser() user: User
    ){
        const expectedLength = LENGTH_INVITE_CODE * 2;

        if(inviteCode.length !== expectedLength){
            throw new ConflictException(`Invalid invite code, invite code must contain ${expectedLength} characters`);
        }

        return await this.houseService.join(inviteCode, user.uuid);
    }
    
    @Post('/create')
    public async create(
        @Body() houseDto: CreateHouseDto,
        @CurrentUser() user: User
    ){
        return await this.houseService.create(houseDto, user.uuid)
    }

    @Post('/regenerate/:uuid')
    public async regenerate(
        @Param('uuid') uuid: string,
        @CurrentUser() user: User
    ){
        return await this.houseService.regenerate(uuid, user.uuid)
    }

}
