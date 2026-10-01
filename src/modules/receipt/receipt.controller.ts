import { Body, Controller, Param, ParseUUIDPipe, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

// ___SERVICE___
import { ReceiptService } from './receipt.service.js';
import { HouseAccessService } from '../../shared/utils/house-access/house-access.service.js';

// ___DTO___
import { ExtractReceiptDto } from './dto/extract-receipt.dto.js';

// ___ENTITY___
import { User } from '../user/entity/user.entity.js';

// ___CONST___
import { MULTER_OPTIONS } from '../../shared/const/multer-options.const.js';

// ___GUARDS___
import { JwtAuthGuard } from '../../shared/utils/token/jwt-auth.guard.js';

// ___DECORATOR___
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';

@Controller('house/:houseUuid/receipts')
@UseGuards(JwtAuthGuard)
export class ReceiptController {
    constructor(
        private readonly receiptService: ReceiptService,
        private readonly houseAccessService: HouseAccessService,
    ){}

    /** Extracts an already uploaded receipt (see POST /file-upload/upload). */
    @Post('extract')
    async extractGroceriesFromReceipt(
        @Param('houseUuid', ParseUUIDPipe) houseUuid: string,
        @Body() extractGroceriesDto: ExtractReceiptDto,
        @CurrentUser() currentUser: User
    ) {
        await this.houseAccessService.getMembership(houseUuid, currentUser.uuid);

        return await this.receiptService.extractGroceriesFromReceipt(extractGroceriesDto.path);
    }

    /** Upload + extract in one request, for the camera flow in the PWA. */
    @Post('scan')
    @UseInterceptors(FileInterceptor('file', MULTER_OPTIONS))
    async scan(
        @Param('houseUuid', ParseUUIDPipe) houseUuid: string,
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() currentUser: User
    ) {
        await this.houseAccessService.getMembership(houseUuid, currentUser.uuid);

        return await this.receiptService.scan(file);
    }
}
