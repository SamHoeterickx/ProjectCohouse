import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';

// ___SERVICE___
import { BalanceService } from './balance.service.js';
import { HouseAccessService } from '../../shared/utils/house-access/house-access.service.js';

// ___ENTITY___
import { User } from '../user/entity/user.entity.js';

// ___GUARDS___
import { JwtAuthGuard } from '../../shared/utils/token/jwt-auth.guard.js';

// ___DECORATOR___
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';

@Controller('house/:houseUuid/balances')
@UseGuards(JwtAuthGuard)
export class BalanceController {

    constructor(
        private readonly balanceService: BalanceService,
        private readonly houseAccessService: HouseAccessService,
    ) {}

    @Get()
    public async getBalances(
        @Param('houseUuid', ParseUUIDPipe) houseUuid: string,
        @CurrentUser() user: User,
    ) {
        await this.houseAccessService.getMembership(houseUuid, user.uuid);

        return await this.balanceService.getBalances(houseUuid);
    }
}
