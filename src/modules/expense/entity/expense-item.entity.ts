import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import type { Relation } from "typeorm";
import { Expense } from "./expense.entity.js";
import { User } from "../../user/entity/user.entity.js";

@Entity()
export class ExpenseItem {

    @PrimaryGeneratedColumn('uuid')
    uuid: string;

    @Column()
    name: string;

    @Column({ type: 'integer', default: 1 })
    amount: number;

    @Column({ type: 'integer' })
    price_per_unit: number;

    @Column({ type: 'integer', default: 0 })
    discount_in_cents: number;

    @Column({ type: 'integer' })
    price: number;

    @ManyToOne(() => Expense, (expense) => expense.items, { onDelete: 'CASCADE' })
    expense: Relation<Expense>;

    @ManyToMany(() => User)
    @JoinTable({ name: 'expense_item_user' })
    assigned_to: User[];
}
