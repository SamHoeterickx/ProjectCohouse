import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';

// ___SERVICE___
import { ActivityService } from './activity.service.js';
import { HouseAccessService } from '../../shared/utils/house-access/house-access.service.js';

// ___DTO___
import { PaginationDto } from '../../shared/dto/pagination.dto.js';

// ___ENTITY___
import { User } from '../user/entity/user.entity.js';

// ___GUARDS___
import { JwtAuthGuard } from '../../shared/utils/token/jwt-auth.guard.js';

// ___DECORATOR___
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';

@Controller('house/:houseUuid/activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {

    constructor(
        private readonly activityService: ActivityService,
        private readonly houseAccessService: HouseAccessService,
    ) {}

    @Get()
    public async list(
        @Param('houseUuid', ParseUUIDPipe) houseUuid: string,
        @Query() query: PaginationDto,
        @CurrentUser() user: User,
    ) {
        await this.houseAccessService.getMembership(houseUuid, user.uuid);

        return await this.activityService.list(houseUuid, query.page, query.limit);
    }
}
