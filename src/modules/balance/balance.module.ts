import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

// ___SERVICE___
import { BalanceService } from './balance.service.js';

// ___CONTROLLER___
import { BalanceController } from './balance.controller.js';

// ___MODULE___
import { ExpenseModule } from '../expense/expense.module.js';
import { HouseAccessModule } from '../../shared/utils/house-access/house-access.module.js';

// ___ENTITY___
import { Expense } from '../expense/entity/expense.entity.js';
import { ExpenseSplit } from '../expense/entity/expense-split.entity.js';
import { Settlement } from '../settlement/entity/settlement.entity.js';
import { User } from '../user/entity/user.entity.js';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        TypeOrmModule.forFeature([Expense, ExpenseSplit, Settlement, User]),
        ExpenseModule,
        HouseAccessModule,
    ],
    controllers: [BalanceController],
    providers: [BalanceService],
    exports: [BalanceService],
})
export class BalanceModule {}
