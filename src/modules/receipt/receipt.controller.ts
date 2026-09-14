import { Body, Controller, ForbiddenException, Post, UseGuards } from '@nestjs/common';
import { ReceiptService } from './receipt.service.js';
import { User } from '../user/entity/user.entity.js';
import { ExtractReceiptDto } from './dto/extract-receipt.dto.js';
import { JwtAuthGuard } from '../../shared/utils/token/jwt-auth.guard.js';
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';

@Controller('receipt')
@UseGuards(JwtAuthGuard)
export class ReceiptController {
    constructor(
        private readonly receiptService: ReceiptService
    ){}

    @Post('extract')
    async extractGroceriesFromReceipt(
        @Body() extractGroceriesDto: ExtractReceiptDto,
        @CurrentUser() currentUser: User
    ) {
        const house = currentUser.houses[0];

        if(!house){
            throw new ForbiddenException("You haven't settled into a house yet.");
        }

        return await this.receiptService.extractGroceriesFromReceipt(extractGroceriesDto.path, house, currentUser);
    }
}
