import { IsNotEmpty, IsUrl } from "class-validator";

export class ExtractReceiptDto {
    @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_tld: false })
    @IsNotEmpty()
    path: string;
}
