import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

// ___SERVICE___
import { UserService } from './user.service.js';

// ___CONTROLLER___
import { UserController } from './user.controller.js';

// ___MODULE___
import { PasswordModule } from '../../shared/utils/password/password.module.js';

// ___ENTITY___
import { User } from './entity/user.entity.js';
import { HouseUser } from './entity/house_user.entity.js';
import { House } from '../house/entity/house.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, HouseUser, House]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    PasswordModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
