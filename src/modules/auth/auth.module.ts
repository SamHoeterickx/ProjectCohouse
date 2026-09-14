import { Module } from '@nestjs/common';

// ___SERVICE___
import { AuthService } from './auth.service.js';

// ____CONTROLLER___
import { AuthController } from './auth.controller.js';

// ___MODULE___
import { PassportModule } from '@nestjs/passport';
import { TokenModule } from '../../shared/utils/token/token.module.js';
import { PasswordModule } from '../../shared/utils/password/password.module.js';
import { UserModule } from '../user/user.module.js';

// ___UTILS___
import { JwtStrategy } from '../../shared/utils/token/jwt.strategy.js';

@Module({
    imports: [
        UserModule,
        TokenModule,
        PasswordModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule {}
