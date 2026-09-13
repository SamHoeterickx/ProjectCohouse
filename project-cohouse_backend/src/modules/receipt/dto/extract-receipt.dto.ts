import { IsNotEmpty, IsString } from "class-validator";

export class ExtractReceiptDto {
    @IsString()
    @IsNotEmpty()
    path: string;
}
