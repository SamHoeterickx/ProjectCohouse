import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class ExpenseParticipantDto {
    @IsUUID()
    user_uuid: string;

    /** Weight for the SHARES split type. */
    @IsOptional()
    @IsInt()
    @Min(0)
    shares?: number;

    /** Fixed amount for the EXACT split type, in cents of the expense currency. */
    @IsOptional()
    @IsInt()
    @Min(0)
    amount_in_cents?: number;
}
