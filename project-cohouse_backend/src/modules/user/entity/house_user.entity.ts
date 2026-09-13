import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import type { Relation } from "typeorm";
import { User } from "./user.entity.js";
import { House } from "../../house/entity/house.entity.js";
import { E_USER_ROLES } from "../../../shared/const/enum.js";

@Entity('house_user')
@Unique(['user', 'house'])
export class HouseUser {
    @PrimaryGeneratedColumn('uuid')
    uuid: string;

    @ManyToOne(
        () => User,
        (user) => user.houseUser
    )
    user: Relation<User>;

    @ManyToOne(
        () => House,
        (house) => house.memberships
    )
    house: Relation<House>;

    @Column({ 
        type: 'enum', 
        enum: E_USER_ROLES, 
        default: E_USER_ROLES.MEMBER 
    })
    role: E_USER_ROLES;
}