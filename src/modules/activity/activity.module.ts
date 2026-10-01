import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

// ___SERVICE___
import { ActivityService } from './activity.service.js';

// ___CONTROLLER___
import { ActivityController } from './activity.controller.js';

// ___MODULE___
import { HouseAccessModule } from '../../shared/utils/house-access/house-access.module.js';

// ___ENTITY___
import { Activity } from './entity/activity.entity.js';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        TypeOrmModule.forFeature([Activity]),
        HouseAccessModule,
    ],
    controllers: [ActivityController],
    providers: [ActivityService],
    exports: [ActivityService],
})
export class ActivityModule {}
