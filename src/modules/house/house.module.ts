import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HouseController } from './house.controller.js';
import { HouseService } from './house.service.js';
import { House } from './entity/house.entity.js';
import { HouseUser } from '../user/entity/house_user.entity.js';
import { Expense } from '../expense/entity/expense.entity.js';
import { UserModule } from '../user/user.module.js';
import { BalanceModule } from '../balance/balance.module.js';
import { ActivityModule } from '../activity/activity.module.js';
import { HouseAccessModule } from '../../shared/utils/house-access/house-access.module.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([House, HouseUser, Expense]),
    UserModule,
    BalanceModule,
    ActivityModule,
    HouseAccessModule,
  ],
  controllers: [HouseController],
  providers: [HouseService]
})
export class HouseModule {}
