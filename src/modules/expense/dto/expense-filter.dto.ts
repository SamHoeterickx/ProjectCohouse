import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

// ___DTO___
import { PaginationDto } from '../../../shared/dto/pagination.dto.js';

// ___CONST___
import { E_EXPENSE_CATEGORY } from '../../../shared/const/enum.js';

export class ExpenseFilterDto extends PaginationDto {
    @IsOptional()
    @IsEnum(E_EXPENSE_CATEGORY)
    category?: E_EXPENSE_CATEGORY;

    @IsOptional()
    @IsUUID()
    paid_by?: string;

    /** Only expenses this user takes part in. */
    @IsOptional()
    @IsUUID()
    participant?: string;

    @IsOptional()
    @IsDateString({ strict: true })
    from?: string;

    @IsOptional()
    @IsDateString({ strict: true })
    to?: string;

    /** Matches title, store and notes. */
    @IsOptional()
    @IsString()
    search?: string;
}
