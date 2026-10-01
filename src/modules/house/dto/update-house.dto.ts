import { IsISO4217CurrencyCode, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateHouseDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    address?: string;

    /** Can only change while the house has no expenses yet. */
    @IsOptional()
    @IsISO4217CurrencyCode()
    currency?: string;
}
