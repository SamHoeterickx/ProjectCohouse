import { Body, Controller, Delete, Get, Header, Param, ParseUUIDPipe, Post, Put, Query, StreamableFile, UseGuards } from '@nestjs/common';

// ___SERVICE___
import { ExpenseService } from './expense.service.js';
import { RecurringExpenseService } from './recurring-expense.service.js';
import { HouseAccessService } from '../../shared/utils/house-access/house-access.service.js';

// ___DTO___
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { ExpenseFilterDto } from './dto/expense-filter.dto.js';

// ___ENTITY___
import { User } from '../user/entity/user.entity.js';

// ___GUARDS___
import { JwtAuthGuard } from '../../shared/utils/token/jwt-auth.guard.js';

// ___DECORATOR___
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';

@Controller('house/:houseUuid/expenses')
@UseGuards(JwtAuthGuard)
export class ExpenseController {

    constructor(
        private readonly expenseService: ExpenseService,
        private readonly recurringExpenseService: RecurringExpenseService,
        private readonly houseAccessService: HouseAccessService,
    ) {}

    @Get()
    public async list(
        @Param('houseUuid', ParseUUIDPipe) houseUuid: string,
        @Query() filter: ExpenseFilterDto,
        @CurrentUser() user: User,
    ) {
        await this.houseAccessService.getMembership(houseUuid, user.uuid);
        await this.recurringExpenseService.processDue(houseUuid);

        return await this.expenseService.list(houseUuid, filter);
    }

    @Get('export')
    @Header('Content-Type', 'text/csv; charset=utf-8')
    @Header('Content-Disposition', 'attachment; filename="expenses.csv"')
    public async export(
        @Param('houseUuid', ParseUUIDPipe) houseUuid: string,
        @Query() filter: ExpenseFilterDto,
        @CurrentUser() user: User,
    ) {
        await this.houseAccessService.getMembership(houseUuid, user.uuid);
        await this.recurringExpenseService.processDue(houseUuid);

        const csv = await this.expenseService.exportCsv(houseUuid, filter);

        // BOM so Excel opens UTF-8 (é, €) correctly.
        return new StreamableFile(Buffer.from('﻿' + csv, 'utf-8'));
    }

    @Get(':expenseUuid')
    public async getOne(
        @Param('houseUuid', ParseUUIDPipe) houseUuid: string,
        @Param('expenseUuid', ParseUUIDPipe) expenseUuid: string,
        @CurrentUser() user: User,
    ) {
        await this.houseAccessService.getMembership(houseUuid, user.uuid);

        return await this.expenseService.getOne(houseUuid, expenseUuid);
    }

    @Post()
    public async create(
        @Param('houseUuid', ParseUUIDPipe) houseUuid: string,
        @Body() dto: CreateExpenseDto,
        @CurrentUser() user: User,
    ) {
        await this.houseAccessService.getMembership(houseUuid, user.uuid);

        return await this.expenseService.create(houseUuid, dto, user.uuid);
    }

    @Put(':expenseUuid')
    public async update(
        @Param('houseUuid', ParseUUIDPipe) houseUuid: string,
        @Param('expenseUuid', ParseUUIDPipe) expenseUuid: string,
        @Body() dto: CreateExpenseDto,
        @CurrentUser() user: User,
    ) {
        await this.houseAccessService.getMembership(houseUuid, user.uuid);

        return await this.expenseService.update(houseUuid, expenseUuid, dto, user.uuid);
    }

    @Delete(':expenseUuid')
    public async remove(
        @Param('houseUuid', ParseUUIDPipe) houseUuid: string,
        @Param('expenseUuid', ParseUUIDPipe) expenseUuid: string,
        @CurrentUser() user: User,
    ) {
        await this.houseAccessService.getMembership(houseUuid, user.uuid);

        return await this.expenseService.remove(houseUuid, expenseUuid, user.uuid);
    }
}
