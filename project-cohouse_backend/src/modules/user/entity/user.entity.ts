import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Exclude } from "class-transformer";
import { HouseUser } from "./house_user.entity.js";
import { House } from "../../house/entity/house.entity.js";

@Entity()
export class User {

    @PrimaryGeneratedColumn('uuid')
    uuid: string;

    @Column()
    name: string;

    @Column()
    email: string;

    @Exclude()
    @Column()
    password: string;

    @OneToMany(
        () => HouseUser, 
        (houseUser) => houseUser.user
    )
    houseUser: HouseUser[];

    get houses(): House[] {
        return (this.houseUser ?? []).map(houseUser => houseUser.house);
    }

    @Exclude()
    @Column({
        type: 'varchar',
        nullable: true,
        select: false
    })
    hashedRefreshToken: string | null;

    @UpdateDateColumn()
    updated_at: Date;

    @CreateDateColumn()
    created_at: Date;
}