import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HouseController } from './house.controller.js';
import { HouseService } from './house.service.js';
import { House } from './entity/house.entity.js';
import { HouseUser } from '../user/entity/house_user.entity.js';
import { UserModule } from '../user/user.module.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([House, HouseUser]),
    UserModule,
  ],
  controllers: [HouseController],
  providers: [HouseService]
})
export class HouseModule {}
