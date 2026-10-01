import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { Relation } from "typeorm";
import { User } from "../../user/entity/user.entity.js";
import { House } from "../../house/entity/house.entity.js";
import { E_EXPENSE_CATEGORY, E_RECURRING_INTERVAL, E_SPLIT_TYPE } from "../../../shared/const/enum.js";

export interface IRecurringParticipant {
    userUuid: string;
    shares?: number;
    amount_in_cents?: number;
}

@Entity()
export class RecurringExpense {

    @PrimaryGeneratedColumn('uuid')
    uuid: string;

    @ManyToOne(() => House, { nullable: false, onDelete: 'CASCADE' })
    house: Relation<House>;

    @Column()
    title: string;

    @Column({ type: 'enum', enum: E_EXPENSE_CATEGORY, default: E_EXPENSE_CATEGORY.OTHER })
    category: E_EXPENSE_CATEGORY;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @Column({ type: 'integer' })
    amount_in_cents: number;

    @ManyToOne(() => User, { nullable: false })
    paid_by: Relation<User>;

    @ManyToOne(() => User, { nullable: false })
    created_by: Relation<User>;

    @Column({ type: 'enum', enum: E_SPLIT_TYPE, default: E_SPLIT_TYPE.EQUAL })
    split_type: E_SPLIT_TYPE;

    @Column({ type: 'jsonb' })
    participants: IRecurringParticipant[];

    @Column({ type: 'enum', enum: E_RECURRING_INTERVAL })
    interval: E_RECURRING_INTERVAL;

    @Column({ type: 'date' })
    start_date: string;

    /** Number of expenses already generated; occurrence n falls on start_date + n × interval. */
    @Column({ type: 'integer', default: 0 })
    occurrences: number;

    @Column({ type: 'date' })
    next_date: string;

    @Column({ type: 'date', nullable: true })
    end_date: string | null;

    @Column({ default: true })
    active: boolean;

    @UpdateDateColumn()
    updated_at: Date;

    @CreateDateColumn()
    created_at: Date;
}
