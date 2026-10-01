import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExpenses1790856371053 implements MigrationInterface {
    name = 'AddExpenses1790856371053'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "house_user" DROP CONSTRAINT "FK_1f7401372d4e69f468cee2b3f35"`);
        await queryRunner.query(`ALTER TABLE "house_user" DROP CONSTRAINT "FK_c9c4e956552ba61e33af1f75659"`);
        await queryRunner.query(`CREATE TABLE "expense_item" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "amount" integer NOT NULL DEFAULT '1', "price_per_unit" integer NOT NULL, "discount_in_cents" integer NOT NULL DEFAULT '0', "price" integer NOT NULL, "expenseUuid" uuid, CONSTRAINT "PK_8a2193bf982d7f0710537defcd5" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE TABLE "expense_split" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount_in_cents" integer NOT NULL, "shares" integer, "expenseUuid" uuid, "userUuid" uuid NOT NULL, CONSTRAINT "UQ_8d027eab59c1eba42f8b26c5866" UNIQUE ("expenseUuid", "userUuid"), CONSTRAINT "PK_ccf748778b5920448c650d87e70" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE TYPE "public"."recurring_expense_category_enum" AS ENUM('groceries', 'rent', 'utilities', 'subscriptions', 'household', 'restaurant', 'transport', 'entertainment', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."recurring_expense_split_type_enum" AS ENUM('equal', 'shares', 'exact', 'items')`);
        await queryRunner.query(`CREATE TYPE "public"."recurring_expense_interval_enum" AS ENUM('weekly', 'monthly', 'yearly')`);
        await queryRunner.query(`CREATE TABLE "recurring_expense" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "category" "public"."recurring_expense_category_enum" NOT NULL DEFAULT 'other', "notes" text, "amount_in_cents" integer NOT NULL, "split_type" "public"."recurring_expense_split_type_enum" NOT NULL DEFAULT 'equal', "participants" jsonb NOT NULL, "interval" "public"."recurring_expense_interval_enum" NOT NULL, "start_date" date NOT NULL, "occurrences" integer NOT NULL DEFAULT '0', "next_date" date NOT NULL, "end_date" date, "active" boolean NOT NULL DEFAULT true, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "houseUuid" uuid NOT NULL, "paidByUuid" uuid NOT NULL, "createdByUuid" uuid NOT NULL, CONSTRAINT "PK_a78a9c89fd11ee9408ed57de0d2" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE TYPE "public"."expense_category_enum" AS ENUM('groceries', 'rent', 'utilities', 'subscriptions', 'household', 'restaurant', 'transport', 'entertainment', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."expense_split_type_enum" AS ENUM('equal', 'shares', 'exact', 'items')`);
        await queryRunner.query(`CREATE TABLE "expense" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "store" character varying, "category" "public"."expense_category_enum" NOT NULL DEFAULT 'other', "notes" text, "amount_in_cents" integer NOT NULL, "currency" character varying(3) NOT NULL, "original_amount_in_cents" integer, "exchange_rate" numeric(12,6), "date" date NOT NULL, "split_type" "public"."expense_split_type_enum" NOT NULL DEFAULT 'equal', "receipt_url" character varying, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "paidByUuid" uuid NOT NULL, "addedByUuid" uuid NOT NULL, "houseUuid" uuid NOT NULL, "recurringExpenseUuid" uuid, CONSTRAINT "PK_45cc9bee3e91e06b9d058a6a75c" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE TABLE "settlement" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount_in_cents" integer NOT NULL, "date" date NOT NULL, "notes" text, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "houseUuid" uuid NOT NULL, "fromUserUuid" uuid NOT NULL, "toUserUuid" uuid NOT NULL, "addedByUuid" uuid NOT NULL, CONSTRAINT "PK_4d40e900a3e27c3e017de9bec54" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE TYPE "public"."activity_action_enum" AS ENUM('house_created', 'house_updated', 'member_joined', 'member_left', 'member_removed', 'member_role_changed', 'expense_created', 'expense_updated', 'expense_deleted', 'settlement_created', 'settlement_deleted', 'recurring_created', 'recurring_updated', 'recurring_deleted')`);
        await queryRunner.query(`CREATE TABLE "activity" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" "public"."activity_action_enum" NOT NULL, "entity_uuid" uuid, "payload" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "houseUuid" uuid NOT NULL, "userUuid" uuid, CONSTRAINT "PK_d848e62c1a30e6fd2091b935c43" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8761d177310ce88904d4349357" ON "activity"  ("houseUuid", "created_at") `);
        await queryRunner.query(`CREATE TABLE "expense_item_user" ("expenseItemUuid" uuid NOT NULL, "userUuid" uuid NOT NULL, CONSTRAINT "PK_4b5b9a8f307f51f49f4a210b9e9" PRIMARY KEY ("expenseItemUuid", "userUuid"))`);
        await queryRunner.query(`CREATE INDEX "IDX_eb1a058884d99f321efceacd00" ON "expense_item_user"  ("expenseItemUuid") `);
        await queryRunner.query(`CREATE INDEX "IDX_7ca3d0273d36c36ec9d43d7332" ON "expense_item_user"  ("userUuid") `);
        // Rename instead of drop + add so existing addresses are kept.
        await queryRunner.query(`ALTER TABLE "house" RENAME COLUMN "adress" TO "address"`);
        // Receipts were never persisted; expenses replace this table.
        await queryRunner.query(`DROP TABLE IF EXISTS "receipt"`);
        await queryRunner.query(`ALTER TABLE "house" ADD "currency" character varying(3) NOT NULL DEFAULT 'EUR'`);
        await queryRunner.query(`ALTER TABLE "house_user" ADD CONSTRAINT "FK_1f7401372d4e69f468cee2b3f35" FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "house_user" ADD CONSTRAINT "FK_c9c4e956552ba61e33af1f75659" FOREIGN KEY ("houseUuid") REFERENCES "house"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expense_item" ADD CONSTRAINT "FK_7197e7ce789c4546072add395d8" FOREIGN KEY ("expenseUuid") REFERENCES "expense"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expense_split" ADD CONSTRAINT "FK_e073082dc52255893caaddb384f" FOREIGN KEY ("expenseUuid") REFERENCES "expense"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expense_split" ADD CONSTRAINT "FK_fc683d622a16a3267de3cdb1ce6" FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" ADD CONSTRAINT "FK_e5286b30d774399f0d4109e1a6c" FOREIGN KEY ("houseUuid") REFERENCES "house"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" ADD CONSTRAINT "FK_8d646d3b857faf1d5696a9ffe36" FOREIGN KEY ("paidByUuid") REFERENCES "user"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" ADD CONSTRAINT "FK_0c48f8accb37de6a8c91a13a492" FOREIGN KEY ("createdByUuid") REFERENCES "user"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expense" ADD CONSTRAINT "FK_efab68947959c249e3e4a01edb7" FOREIGN KEY ("paidByUuid") REFERENCES "user"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expense" ADD CONSTRAINT "FK_4afcf136ec0a71899e47ab4a372" FOREIGN KEY ("addedByUuid") REFERENCES "user"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expense" ADD CONSTRAINT "FK_9613eeff2db9fb1f9f3e877cd1d" FOREIGN KEY ("houseUuid") REFERENCES "house"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expense" ADD CONSTRAINT "FK_a7d78aa37deae52e4eea1cf1472" FOREIGN KEY ("recurringExpenseUuid") REFERENCES "recurring_expense"("uuid") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "settlement" ADD CONSTRAINT "FK_c4bb5a9d7c692dd49dd91e8baf0" FOREIGN KEY ("houseUuid") REFERENCES "house"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "settlement" ADD CONSTRAINT "FK_613fb8cabf2f6c0e6f55d7feb9b" FOREIGN KEY ("fromUserUuid") REFERENCES "user"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "settlement" ADD CONSTRAINT "FK_982aeef5a16c4824842631289aa" FOREIGN KEY ("toUserUuid") REFERENCES "user"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "settlement" ADD CONSTRAINT "FK_bc092d53a1b4a85292f8797c826" FOREIGN KEY ("addedByUuid") REFERENCES "user"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity" ADD CONSTRAINT "FK_f75f47ac28882cf1f883f78ed98" FOREIGN KEY ("houseUuid") REFERENCES "house"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity" ADD CONSTRAINT "FK_c15b409b27711f27f8436fea563" FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expense_item_user" ADD CONSTRAINT "FK_eb1a058884d99f321efceacd003" FOREIGN KEY ("expenseItemUuid") REFERENCES "expense_item"("uuid") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "expense_item_user" ADD CONSTRAINT "FK_7ca3d0273d36c36ec9d43d73323" FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expense_item_user" DROP CONSTRAINT "FK_7ca3d0273d36c36ec9d43d73323"`);
        await queryRunner.query(`ALTER TABLE "expense_item_user" DROP CONSTRAINT "FK_eb1a058884d99f321efceacd003"`);
        await queryRunner.query(`ALTER TABLE "activity" DROP CONSTRAINT "FK_c15b409b27711f27f8436fea563"`);
        await queryRunner.query(`ALTER TABLE "activity" DROP CONSTRAINT "FK_f75f47ac28882cf1f883f78ed98"`);
        await queryRunner.query(`ALTER TABLE "settlement" DROP CONSTRAINT "FK_bc092d53a1b4a85292f8797c826"`);
        await queryRunner.query(`ALTER TABLE "settlement" DROP CONSTRAINT "FK_982aeef5a16c4824842631289aa"`);
        await queryRunner.query(`ALTER TABLE "settlement" DROP CONSTRAINT "FK_613fb8cabf2f6c0e6f55d7feb9b"`);
        await queryRunner.query(`ALTER TABLE "settlement" DROP CONSTRAINT "FK_c4bb5a9d7c692dd49dd91e8baf0"`);
        await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT "FK_a7d78aa37deae52e4eea1cf1472"`);
        await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT "FK_9613eeff2db9fb1f9f3e877cd1d"`);
        await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT "FK_4afcf136ec0a71899e47ab4a372"`);
        await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT "FK_efab68947959c249e3e4a01edb7"`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" DROP CONSTRAINT "FK_0c48f8accb37de6a8c91a13a492"`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" DROP CONSTRAINT "FK_8d646d3b857faf1d5696a9ffe36"`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" DROP CONSTRAINT "FK_e5286b30d774399f0d4109e1a6c"`);
        await queryRunner.query(`ALTER TABLE "expense_split" DROP CONSTRAINT "FK_fc683d622a16a3267de3cdb1ce6"`);
        await queryRunner.query(`ALTER TABLE "expense_split" DROP CONSTRAINT "FK_e073082dc52255893caaddb384f"`);
        await queryRunner.query(`ALTER TABLE "expense_item" DROP CONSTRAINT "FK_7197e7ce789c4546072add395d8"`);
        await queryRunner.query(`ALTER TABLE "house_user" DROP CONSTRAINT "FK_c9c4e956552ba61e33af1f75659"`);
        await queryRunner.query(`ALTER TABLE "house_user" DROP CONSTRAINT "FK_1f7401372d4e69f468cee2b3f35"`);
        await queryRunner.query(`ALTER TABLE "house" DROP COLUMN "currency"`);
        await queryRunner.query(`ALTER TABLE "house" RENAME COLUMN "address" TO "adress"`);
        await queryRunner.query(`CREATE TABLE "receipt" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "store" character varying NOT NULL, "date" character varying NOT NULL, "total_price" integer NOT NULL, "items" jsonb NOT NULL, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "addedByUuid" uuid, "houseUuid" uuid, CONSTRAINT "PK_955d31eb5e5c21c3f56d6fa94c3" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`ALTER TABLE "receipt" ADD CONSTRAINT "FK_6ec629463c9fd41c8a97d46fa42" FOREIGN KEY ("addedByUuid") REFERENCES "user"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "receipt" ADD CONSTRAINT "FK_b7a28c22e11b011a67c8626350d" FOREIGN KEY ("houseUuid") REFERENCES "house"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7ca3d0273d36c36ec9d43d7332"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eb1a058884d99f321efceacd00"`);
        await queryRunner.query(`DROP TABLE "expense_item_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8761d177310ce88904d4349357"`);
        await queryRunner.query(`DROP TABLE "activity"`);
        await queryRunner.query(`DROP TYPE "public"."activity_action_enum"`);
        await queryRunner.query(`DROP TABLE "settlement"`);
        await queryRunner.query(`DROP TABLE "expense"`);
        await queryRunner.query(`DROP TYPE "public"."expense_split_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."expense_category_enum"`);
        await queryRunner.query(`DROP TABLE "recurring_expense"`);
        await queryRunner.query(`DROP TYPE "public"."recurring_expense_interval_enum"`);
        await queryRunner.query(`DROP TYPE "public"."recurring_expense_split_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."recurring_expense_category_enum"`);
        await queryRunner.query(`DROP TABLE "expense_split"`);
        await queryRunner.query(`DROP TABLE "expense_item"`);
        await queryRunner.query(`ALTER TABLE "house_user" ADD CONSTRAINT "FK_c9c4e956552ba61e33af1f75659" FOREIGN KEY ("houseUuid") REFERENCES "house"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "house_user" ADD CONSTRAINT "FK_1f7401372d4e69f468cee2b3f35" FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
