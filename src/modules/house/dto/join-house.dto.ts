import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";
import { LENGTH_INVITE_CODE } from "../../../shared/const/house.const.js";

export class JoinHouseDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(LENGTH_INVITE_CODE)
    @MaxLength(LENGTH_INVITE_CODE)
    inviteCode: string;
}