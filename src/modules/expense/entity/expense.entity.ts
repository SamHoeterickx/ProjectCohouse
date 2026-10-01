import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { Relation } from "typeorm";
import { User } from "../../user/entity/user.entity.js";
import { House } from "../../house/entity/house.entity.js";
import { ExpenseItem } from "./expense-item.entity.js";
import { ExpenseSplit } from "./expense-split.entity.js";
import { RecurringExpense } from "../../recurring-expense/entity/recurring-expense.entity.js";
import { E_EXPENSE_CATEGORY, E_SPLIT_TYPE } from "../../../shared/const/enum.js";

@Entity()
export class Expense {

    @PrimaryGeneratedColumn('uuid')
    uuid: string;

    @Column()
    title: string;

    @Column({ type: 'varchar', nullable: true })
    store: string | null;

    @Column({ type: 'enum', enum: E_EXPENSE_CATEGORY, default: E_EXPENSE_CATEGORY.OTHER })
    category: E_EXPENSE_CATEGORY;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    /** Amount in the house currency, in cents. */
    @Column({ type: 'integer' })
    amount_in_cents: number;

    /** Currency the expense was originally paid in. */
    @Column({ type: 'varchar', length: 3 })
    currency: string;

    @Column({ type: 'integer', nullable: true })
    original_amount_in_cents: number | null;

    @Column({ type: 'numeric', precision: 12, scale: 6, nullable: true })
    exchange_rate: string | null;

    @Column({ type: 'date' })
    date: string;

    @Column({ type: 'enum', enum: E_SPLIT_TYPE, default: E_SPLIT_TYPE.EQUAL })
    split_type: E_SPLIT_TYPE;

    @Column({ type: 'varchar', nullable: true })
    receipt_url: string | null;

    @ManyToOne(() => User, { nullable: false })
    paid_by: Relation<User>;

    @ManyToOne(() => User, { nullable: false })
    added_by: Relation<User>;

    @ManyToOne(() => House, { nullable: false, onDelete: 'CASCADE' })
    house: Relation<House>;

    @ManyToOne(() => RecurringExpense, { nullable: true, onDelete: 'SET NULL' })
    recurring_expense: Relation<RecurringExpense> | null;

    @OneToMany(() => ExpenseItem, (item) => item.expense, { cascade: true })
    items: ExpenseItem[];

    @OneToMany(() => ExpenseSplit, (split) => split.expense, { cascade: true })
    splits: ExpenseSplit[];

    @UpdateDateColumn()
    updated_at: Date;

    @CreateDateColumn()
    created_at: Date;
}
