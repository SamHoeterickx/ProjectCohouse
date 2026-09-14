import { Module } from '@nestjs/common';

// ___MODULE___
import { PasswordService } from './password.service.js';

@Module({
  providers: [PasswordService],
  exports: [PasswordService]
})
export class PasswordModule {}
