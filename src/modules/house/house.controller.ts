import { Body, ConflictException, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';

// ___SERVICE___
import { HouseService } from './house.service.js';

// ___DTO___
import { CreateHouseDto } from './dto/create-house.dto.js';
import { UpdateHouseDto } from './dto/update-house.dto.js';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto.js';

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
        @Param('houseUuid', ParseUUIDPipe) houseUuid: string,
        @CurrentUser() user: User
    ){
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

    @Patch('/:houseUuid')
    public async update(
        @Param('houseUuid', ParseUUIDPipe) houseUuid: string,
        @Body() houseDto: UpdateHouseDto,
        @CurrentUser() user: User
    ){
        return await this.houseService.update(houseUuid, houseDto, user.uuid);
    }

    @Delete('/:houseUuid')
    public async remove(
        @Param('houseUuid', ParseUUIDPipe) houseUuid: string,
        @CurrentUser() user: User
    ){
        return await this.houseService.remove(houseUuid, user.uuid);
    }

    @Post('/:houseUuid/leave')
    @HttpCode(200)
    public async leave(
        @Param('houseUuid', ParseUUIDPipe) houseUuid: string,
        @CurrentUser() user: User
    ){
        return await this.houseService.leave(houseUuid, user.uuid);
    }

    @Delete('/:houseUuid/members/:memberUuid')
    public async removeMember(
        @Param('houseUuid', ParseUUIDPipe) houseUuid: string,
        @Param('memberUuid', ParseUUIDPipe) memberUuid: string,
        @CurrentUser() user: User
    ){
        return await this.houseService.removeMember(houseUuid, memberUuid, user.uuid);
    }

    @Patch('/:houseUuid/members/:memberUuid')
    public async changeRole(
        @Param('houseUuid', ParseUUIDPipe) houseUuid: string,
        @Param('memberUuid', ParseUUIDPipe) memberUuid: string,
        @Body() dto: UpdateMemberRoleDto,
        @CurrentUser() user: User
    ){
        return await this.houseService.changeRole(houseUuid, memberUuid, dto.role, user.uuid);
    }

    @Post('/regenerate/:uuid')
    public async regenerate(
        @Param('uuid', ParseUUIDPipe) uuid: string,
        @CurrentUser() user: User
    ){
        return await this.houseService.regenerate(uuid, user.uuid)
    }

}
