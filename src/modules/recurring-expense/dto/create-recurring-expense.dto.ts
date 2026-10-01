import { Type } from 'class-transformer';
import {
    ArrayNotEmpty, IsArray, IsBoolean, IsDateString, IsEnum, IsIn, IsInt, IsNotEmpty,
    IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested,
} from 'class-validator';

// ___DTO___
import { ExpenseParticipantDto } from '../../expense/dto/expense-participant.dto.js';

// ___CONST___
import { E_EXPENSE_CATEGORY, E_RECURRING_INTERVAL, E_SPLIT_TYPE } from '../../../shared/const/enum.js';

export class CreateRecurringExpenseDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title: string;

    @IsOptional()
    @IsEnum(E_EXPENSE_CATEGORY)
    category?: E_EXPENSE_CATEGORY;

    @IsOptional()
    @IsString()
    notes?: string;

    /** In cents of the house currency. */
    @IsInt()
    @Min(0)
    amount_in_cents: number;

    @IsUUID()
    paid_by: string;

    /** Item splits make no sense for a recurring expense. */
    @IsIn([E_SPLIT_TYPE.EQUAL, E_SPLIT_TYPE.SHARES, E_SPLIT_TYPE.EXACT])
    split_type: E_SPLIT_TYPE;

    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => ExpenseParticipantDto)
    participants: ExpenseParticipantDto[];

    @IsEnum(E_RECURRING_INTERVAL)
    interval: E_RECURRING_INTERVAL;

    /** First occurrence. Occurrences in the past are generated immediately. */
    @IsDateString({ strict: true })
    start_date: string;

    @IsOptional()
    @IsDateString({ strict: true })
    end_date?: string;

    @IsOptional()
    @IsBoolean()
    active?: boolean;
}
