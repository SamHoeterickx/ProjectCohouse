import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from './modules/user/entity/user.entity.js';
import { HouseUser } from './modules/user/entity/house_user.entity.js';
import { House } from './modules/house/entity/house.entity.js';
import { Expense } from './modules/expense/entity/expense.entity.js';
import { ExpenseItem } from './modules/expense/entity/expense-item.entity.js';
import { ExpenseSplit } from './modules/expense/entity/expense-split.entity.js';
import { Settlement } from './modules/settlement/entity/settlement.entity.js';
import { RecurringExpense } from './modules/recurring-expense/entity/recurring-expense.entity.js';
import { Activity } from './modules/activity/entity/activity.entity.js';

// Same env file as the app (app.module.ts): env/.env.<NODE_ENV>, defaulting to development.
config({ path: `env/.env.${process.env.NODE_ENV ?? 'development'}` });

export const AppDataSource = new DataSource({
    type: 'postgres',
    ...(process.env.DATABASE_STRING
        ? { url: process.env.DATABASE_STRING, ssl: { rejectUnauthorized: false } }
        : {}),
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [User, HouseUser, House, Expense, ExpenseItem, ExpenseSplit, Settlement, RecurringExpense, Activity],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
});
