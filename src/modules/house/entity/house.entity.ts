import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { HouseUser } from "../../user/entity/house_user.entity.js";

@Entity()
export class House {

    @PrimaryGeneratedColumn('uuid')
    uuid: string;

    @Column()
    adress: string;

    @Column()
    name: string;

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