import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

// ___CONST___
import { APP_VERSION, STARTED_AT } from '../../shared/config/version.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** Public, so the app can show which API version it talks to. */
  @Get('version')
  getVersion() {
    return {
      message: 'Version retrieved successfully',
      data: { version: APP_VERSION, started_at: STARTED_AT },
    };
  }
}
