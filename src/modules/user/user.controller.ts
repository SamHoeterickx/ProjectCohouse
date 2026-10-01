import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

// ___SERVICE___
import { UserService } from './user.service.js';

// ___DTO___
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

// ___ENTITY___
import { User } from './entity/user.entity.js';

// ___GUARDS___
import { JwtAuthGuard } from '../../shared/utils/token/jwt-auth.guard.js';

// ___DECORATOR___
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {

    constructor(
        private readonly userService: UserService
    ){}

    @Get('/me')
    public async getMe(@CurrentUser() user: User) {
        return await this.userService.getMe(user.uuid);
    }

    @Patch('/me')
    public async updateMe(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
        return await this.userService.updateMe(user.uuid, dto);
    }

    @Patch('/me/password')
    public async changePassword(@CurrentUser() user: User, @Body() dto: ChangePasswordDto) {
        return await this.userService.changePassword(user.uuid, dto);
    }
}
