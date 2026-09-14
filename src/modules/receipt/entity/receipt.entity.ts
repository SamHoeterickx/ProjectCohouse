import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { Relation } from "typeorm";
import { User } from "../../user/entity/user.entity.js";
import { House } from "../../house/entity/house.entity.js";
import { IReceiptItem } from "../interfaces/receipt-response.interface.js";

@Entity()
export class Receipt {

    @PrimaryGeneratedColumn('uuid')
    uuid: string;

    @Column()
    store: string;

    @Column()
    date: string;

    @Column()
    total_price: number;

    @Column({ type: 'jsonb' })
    items: IReceiptItem[];

    @ManyToOne(() => User)
    added_by: Relation<User>;

    @ManyToOne(() => House)
    house: Relation<House>;

    @UpdateDateColumn()
    updated_at: Date;

    @CreateDateColumn()
    created_at: Date;
}
