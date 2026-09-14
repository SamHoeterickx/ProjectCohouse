import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';

// ___SERVICE___
import { UserService } from '../user/user.service.js';
import { TokenService } from '../../shared/utils/token/token.service.js';
import { PasswordService } from '../../shared/utils/password/password.service.js';

// ___DTO___
import { LoginUserDto } from './dto/login-user.dto.js';
import { RegisterUserDto } from './dto/register-user.dto.js';

// ___INTERFACE___
import { IServiceResponse } from '../../shared/interfaces/service-response.interface.js';

@Injectable()
export class AuthService {

    constructor(
        private readonly userService: UserService,
        private readonly tokenService: TokenService,
        private readonly passwordService: PasswordService,
    ) {}

    public async login(credentials: LoginUserDto): Promise<IServiceResponse> {
        const { email, password } = credentials;

        const user = await this.userService.findUserByEmail(email, {
            uuid: true,
            email: true,
            password: true,
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const passwordMatch = await this.passwordService.compare(password, user.password);

        if (!passwordMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return {
            statusCode: 200,
            message: 'Login successful.',
            data: await this.issueTokens(user.uuid, user.email),
        };
    }

    public async register(credentials: RegisterUserDto): Promise<IServiceResponse> {
        const { name, email, password, repeatPassword } = credentials;

        if(password !== repeatPassword) {
            throw new ConflictException('Passwords dont match');
        }

        const exestingUser = await this.userService.findUserByEmail(email, { uuid: true });
        if (exestingUser) {
            throw new ConflictException('Email already in use');
        }

        const hashedPassword = await this.passwordService.hash(password);

        const user = await this.userService.createUser({
            name,
            email,
            password: hashedPassword,
        });

        return {
            statusCode: 201,
            message: 'Registration successful.',
            data: await this.issueTokens(user.uuid, user.email),
        };
    }

    private async issueTokens(uuid: string, email: string) {
        const accessToken = await this.tokenService.generateAccessToken(uuid, email);
        const refreshToken = await this.tokenService.generateRefreshToken(uuid, email);
        return { accessToken, refreshToken };
    }

}