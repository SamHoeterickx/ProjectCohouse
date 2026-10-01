import { ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class ExpenseItemDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsInt()
    @Min(1)
    amount: number;

    @IsInt()
    price_per_unit: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    discount_in_cents?: number;

    @IsInt()
    price: number;

    @IsArray()
    @ArrayNotEmpty()
    @IsUUID('all', { each: true })
    assigned_to: string[];
}
