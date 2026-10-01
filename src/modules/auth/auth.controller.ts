import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';

// ___SERVICE___
import { AuthService } from './auth.service.js';

// ___DTO___
import { LoginUserDto } from './dto/login-user.dto.js';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';

// ___ENTITY___
import { User } from '../user/entity/user.entity.js';

// ___GUARDS___
import { JwtAuthGuard } from '../../shared/utils/token/jwt-auth.guard.js';

// ___DECORATOR___
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';

@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService
    ) {}

    @Post('/login')
    public async login(@Body() credentials: LoginUserDto) {
        return this.authService.login(credentials);
    }

    @Post('/register')
    public async register(@Body() data: RegisterUserDto) {
        return this.authService.register(data);
    }

    @Post('/refresh')
    @HttpCode(200)
    public async refresh(@Body() data: RefreshTokenDto) {
        return this.authService.refresh(data.refreshToken);
    }

    @Post('/logout')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    public async logout(@CurrentUser() user: User) {
        return this.authService.logout(user.uuid);
    }
}
