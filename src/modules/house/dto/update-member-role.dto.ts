import { IsEnum } from "class-validator";
import { E_USER_ROLES } from "../../../shared/const/enum.js";

export class UpdateMemberRoleDto {
    @IsEnum(E_USER_ROLES)
    role: E_USER_ROLES;
}
