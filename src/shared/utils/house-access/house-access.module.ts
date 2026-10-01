import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ___SERVICE___
import { HouseAccessService } from './house-access.service.js';

// ___ENTITY___
import { HouseUser } from '../../../modules/user/entity/house_user.entity.js';

@Module({
    imports: [TypeOrmModule.forFeature([HouseUser])],
    providers: [HouseAccessService],
    exports: [HouseAccessService],
})
export class HouseAccessModule {}
