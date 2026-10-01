import { IsISO4217CurrencyCode, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateHouseDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    address: string;

    /** ISO 4217 code, defaults to EUR. */
    @IsOptional()
    @IsISO4217CurrencyCode()
    currency?: string;
}
