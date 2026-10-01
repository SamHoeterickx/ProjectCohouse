import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import type { Relation } from "typeorm";
import { User } from "../../user/entity/user.entity.js";
import { House } from "../../house/entity/house.entity.js";
import { E_ACTIVITY_ACTION } from "../../../shared/const/enum.js";

@Entity()
@Index(['house', 'created_at'])
export class Activity {

    @PrimaryGeneratedColumn('uuid')
    uuid: string;

    @ManyToOne(() => House, { nullable: false, onDelete: 'CASCADE' })
    house: Relation<House>;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    user: Relation<User> | null;

    @Column({ type: 'enum', enum: E_ACTIVITY_ACTION })
    action: E_ACTIVITY_ACTION;

    @Column({ type: 'uuid', nullable: true })
    entity_uuid: string | null;

    @Column({ type: 'jsonb', nullable: true })
    payload: Record<string, unknown> | null;

    @CreateDateColumn()
    created_at: Date;
}
