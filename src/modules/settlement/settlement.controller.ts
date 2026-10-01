import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';

// ___SERVICE___
import { SettlementService } from './settlement.service.js';
import { HouseAccessService } from '../../shared/utils/house-access/house-access.service.js';

// ___DTO___
import { CreateSettlementDto } from './dto/create-settlement.dto.js';
import { PaginationDto } from '../../shared/dto/pagination.dto.js';

// ___ENTITY___
import { User } from '../user/entity/user.entity.js';

// ___GUARDS___
import { JwtAuthGuard } from '../../shared/utils/token/jwt-auth.guard.js';

// ___DECORATOR___
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';

@Controller('house/:houseUuid/settlements')
@UseGuards(JwtAuthGuard)
export class SettlementController {

    constructor(
        private readonly settlementService: SettlementService,
        private readonly houseAccessService: HouseAccessService,
    ) {}

    @Get()
    public async list(
        @Param('houseUuid', ParseUUIDPipe) houseUuid: string,
        @Query() pagination: PaginationDto,
        @CurrentUser() user: User,
    ) {
        await this.houseAccessService.getMembership(houseUuid, user.uuid);

        return await this.settlementService.list(houseUuid, pagination);
    }

    @Post()
    public async create(
        @Param('houseUuid', ParseUUIDPipe) houseUuid: string,
        @Body() dto: CreateSettlementDto,
        @CurrentUser() user: User,
    ) {
        await this.houseAccessService.getMembership(houseUuid, user.uuid);

        return await this.settlementService.create(houseUuid, dto, user.uuid);
    }

    @Delete(':uuid')
    public async remove(
        @Param('houseUuid', ParseUUIDPipe) houseUuid: string,
        @Param('uuid', ParseUUIDPipe) uuid: string,
        @CurrentUser() user: User,
    ) {
        await this.houseAccessService.getMembership(houseUuid, user.uuid);

        return await this.settlementService.remove(houseUuid, uuid, user.uuid);
    }
}
