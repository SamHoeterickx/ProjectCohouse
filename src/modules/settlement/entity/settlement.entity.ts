import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { Relation } from "typeorm";
import { User } from "../../user/entity/user.entity.js";
import { House } from "../../house/entity/house.entity.js";

@Entity()
export class Settlement {

    @PrimaryGeneratedColumn('uuid')
    uuid: string;

    @ManyToOne(() => House, { nullable: false, onDelete: 'CASCADE' })
    house: Relation<House>;

    @ManyToOne(() => User, { nullable: false })
    from_user: Relation<User>;

    @ManyToOne(() => User, { nullable: false })
    to_user: Relation<User>;

    @Column({ type: 'integer' })
    amount_in_cents: number;

    @Column({ type: 'date' })
    date: string;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @ManyToOne(() => User, { nullable: false })
    added_by: Relation<User>;

    @UpdateDateColumn()
    updated_at: Date;

    @CreateDateColumn()
    created_at: Date;
}
