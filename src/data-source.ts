import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from './modules/user/entity/user.entity.js';
import { HouseUser } from './modules/user/entity/house_user.entity.js';
import { House } from './modules/house/entity/house.entity.js';
import { Receipt } from './modules/receipt/entity/receipt.entity.js';

config({ path: 'env/.env' });

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [User, HouseUser, House, Receipt],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
});
