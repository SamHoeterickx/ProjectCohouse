import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

// ___CONTROLLER___
import { RecurringExpenseController } from './recurring-expense.controller.js';

// ___MODULE___
import { ExpenseModule } from '../expense/expense.module.js';
import { HouseAccessModule } from '../../shared/utils/house-access/house-access.module.js';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        ExpenseModule,
        HouseAccessModule,
    ],
    controllers: [RecurringExpenseController],
})
export class RecurringExpenseModule {}
