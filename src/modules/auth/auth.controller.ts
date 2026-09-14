import { Body, Controller, Post } from '@nestjs/common';

// ___SERVICE___
import { AuthService } from './auth.service.js';

// ___DTO___
import { LoginUserDto } from './dto/login-user.dto.js';
import { RegisterUserDto } from './dto/register-user.dto.js';

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
}
