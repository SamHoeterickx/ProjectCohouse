import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { HouseUser } from "../../user/entity/house_user.entity.js";
import { DEFAULT_CURRENCY } from "../../../shared/const/house.const.js";

@Entity()
export class House {

    @PrimaryGeneratedColumn('uuid')
    uuid: string;

    @Column()
    address: string;

    @Column()
    name: string;

    @Column({ type: 'varchar', length: 3, default: DEFAULT_CURRENCY })
    currency: string;

    @OneToMany(
        () => HouseUser, 
        (houseUser) => houseUser.house
    )
    memberships: HouseUser[];

    @Column({ unique: true })
    inviteCode: string;

    @UpdateDateColumn()
    updated_at: Date;

    @CreateDateColumn()
    created_at: Date;
}
