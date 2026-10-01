import { IsNotEmpty, IsUrl } from "class-validator";

export class ExtractReceiptDto {
    @IsUrl({ protocols: ['https'], require_protocol: true })
    @IsNotEmpty()
    path: string;
}
