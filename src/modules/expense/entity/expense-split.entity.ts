import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import type { Relation } from "typeorm";
import { Expense } from "./expense.entity.js";
import { User } from "../../user/entity/user.entity.js";

@Entity()
@Unique(['expense', 'user'])
export class ExpenseSplit {

    @PrimaryGeneratedColumn('uuid')
    uuid: string;

    @ManyToOne(() => Expense, (expense) => expense.splits, { onDelete: 'CASCADE' })
    expense: Relation<Expense>;

    @ManyToOne(() => User, { nullable: false })
    user: Relation<User>;

    /** Share of the expense this user carries, in cents. */
    @Column({ type: 'integer' })
    amount_in_cents: number;

    /** Weight used for the SHARES split type. */
    @Column({ type: 'integer', nullable: true })
    shares: number | null;
}
