import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

// ___SERVICE___
import { ExpenseService } from './expense.service.js';
import { RecurringExpenseService } from './recurring-expense.service.js';

// ___CONTROLLER___
import { ExpenseController } from './expense.controller.js';

// ___MODULE___
import { ActivityModule } from '../activity/activity.module.js';
import { HouseAccessModule } from '../../shared/utils/house-access/house-access.module.js';

// ___ENTITY___
import { Expense } from './entity/expense.entity.js';
import { ExpenseItem } from './entity/expense-item.entity.js';
import { ExpenseSplit } from './entity/expense-split.entity.js';
import { RecurringExpense } from '../recurring-expense/entity/recurring-expense.entity.js';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        TypeOrmModule.forFeature([Expense, ExpenseItem, ExpenseSplit, RecurringExpense]),
        ActivityModule,
        HouseAccessModule,
    ],
    controllers: [ExpenseController],
    providers: [ExpenseService, RecurringExpenseService],
    exports: [ExpenseService, RecurringExpenseService],
})
export class ExpenseModule {}
