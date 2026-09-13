import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

// ___SERVICE___
import { TokenService } from './token.service.js';

@Module({
  imports: [JwtModule.register({})],
  providers: [TokenService],
  exports: [TokenService]
})
export class TokenModule {}
