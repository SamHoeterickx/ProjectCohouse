import { Type } from 'class-transformer';
import {
    IsArray, IsDateString, IsEnum, IsInt, IsISO4217CurrencyCode, IsNotEmpty, IsOptional,
    IsPositive, IsString, IsUrl, IsUUID, MaxLength, Min, ValidateNested,
} from 'class-validator';

// ___DTO___
import { ExpenseParticipantDto } from './expense-participant.dto.js';
import { ExpenseItemDto } from './expense-item.dto.js';

// ___CONST___
import { E_EXPENSE_CATEGORY, E_SPLIT_TYPE } from '../../../shared/const/enum.js';

export class CreateExpenseDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    store?: string;

    @IsOptional()
    @IsEnum(E_EXPENSE_CATEGORY)
    category?: E_EXPENSE_CATEGORY;

    @IsOptional()
    @IsString()
    notes?: string;

    /** Total in cents of `currency` (defaults to the house currency). */
    @IsInt()
    @Min(0)
    amount_in_cents: number;

    @IsOptional()
    @IsISO4217CurrencyCode()
    currency?: string;

    /** Required when `currency` differs from the house currency: 1 unit of `currency` = rate × house currency. */
    @IsOptional()
    @IsPositive()
    exchange_rate?: number;

    @IsDateString({ strict: true })
    date: string;

    @IsUUID()
    paid_by: string;

    @IsEnum(E_SPLIT_TYPE)
    split_type: E_SPLIT_TYPE;

    /** Required for EQUAL, SHARES and EXACT. Ignored for ITEMS (derived from items). */
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ExpenseParticipantDto)
    participants?: ExpenseParticipantDto[];

    /** Receipt lines. Required for ITEMS, optional otherwise. */
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ExpenseItemDto)
    items?: ExpenseItemDto[];

    @IsOptional()
    @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_tld: false })
    receipt_url?: string;
}
