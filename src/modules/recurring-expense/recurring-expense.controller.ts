import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from '@nestjs/common';

// ___SERVICE___
import { RecurringExpenseService } from '../expense/recurring-expense.service.js';
import { HouseAccessService } from '../../shared/utils/house-access/house-access.service.js';

// ___DTO___
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto.js';

// ___ENTITY___
import { User } from '../user/entity/user.entity.js';

// ___GUARDS___
import { JwtAuthGuard } from '../../shared/utils/token/jwt-auth.guard.js';

// ___DECORATOR___
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';

@Controller('house/:houseUuid/recurring-expenses')
@UseGuards(JwtAuthGuard)
export class RecurringExpenseController {

    constructor(
        private readonly recurringExpenseService: RecurringExpenseService,
        private readonly houseAccessService: HouseAccessService,
    ) {}

    @Get()
    public async list(
        @Param('houseUuid', ParseUUIDPipe) houseUuid: string,
        @CurrentUser() user: User,
    ) {
        await this.houseAccessService.getMembership(houseUuid, user.uuid);
        await this.recurringExpenseService.processDue(houseUuid);

        return await this.recurringExpenseService.list(houseUuid);
    }

    @Post()
    public async create(
        @Param('houseUuid', ParseUUIDPipe) houseUuid: string,
        @Body() dto: CreateRecurringExpenseDto,
        @CurrentUser() user: User,
    ) {
        await this.houseAccessService.getMembership(houseUuid, user.uuid);

        return await this.recurringExpenseService.create(houseUuid, dto, user.uuid);
    }

    @Put(':uuid')
    public async update(
        @Param('houseUuid', ParseUUIDPipe) houseUuid: string,
        @Param('uuid', ParseUUIDPipe) uuid: string,
        @Body() dto: CreateRecurringExpenseDto,
        @CurrentUser() user: User,
    ) {
        await this.houseAccessService.getMembership(houseUuid, user.uuid);

        return await this.recurringExpenseService.update(houseUuid, uuid, dto, user.uuid);
    }

    @Delete(':uuid')
    public async remove(
        @Param('houseUuid', ParseUUIDPipe) houseUuid: string,
        @Param('uuid', ParseUUIDPipe) uuid: string,
        @CurrentUser() user: User,
    ) {
        await this.houseAccessService.getMembership(houseUuid, user.uuid);

        return await this.recurringExpenseService.remove(houseUuid, uuid, user.uuid);
    }
}
