import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

// ___SERVICE___
import { SettlementService } from './settlement.service.js';

// ___CONTROLLER___
import { SettlementController } from './settlement.controller.js';

// ___MODULE___
import { ActivityModule } from '../activity/activity.module.js';
import { HouseAccessModule } from '../../shared/utils/house-access/house-access.module.js';

// ___ENTITY___
import { Settlement } from './entity/settlement.entity.js';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        TypeOrmModule.forFeature([Settlement]),
        ActivityModule,
        HouseAccessModule,
    ],
    controllers: [SettlementController],
    providers: [SettlementService],
})
export class SettlementModule {}
