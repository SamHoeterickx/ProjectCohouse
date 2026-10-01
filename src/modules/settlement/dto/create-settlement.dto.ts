import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateSettlementDto {
    /** Who paid the money back. */
    @IsUUID()
    from_user: string;

    /** Who received it. */
    @IsUUID()
    to_user: string;

    @IsInt()
    @Min(1)
    amount_in_cents: number;

    @IsDateString({ strict: true })
    date: string;

    @IsOptional()
    @IsString()
    notes?: string;
}
