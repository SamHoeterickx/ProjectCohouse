import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReceipt1788982976324 implements MigrationInterface {
    name = 'AddReceipt1788982976324'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "receipt" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "store" character varying NOT NULL, "date" character varying NOT NULL, "total_price" integer NOT NULL, "items" jsonb NOT NULL, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "addedByUuid" uuid, "houseUuid" uuid, CONSTRAINT "PK_955d31eb5e5c21c3f56d6fa94c3" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`ALTER TABLE "receipt" ADD CONSTRAINT "FK_6ec629463c9fd41c8a97d46fa42" FOREIGN KEY ("addedByUuid") REFERENCES "user"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "receipt" ADD CONSTRAINT "FK_b7a28c22e11b011a67c8626350d" FOREIGN KEY ("houseUuid") REFERENCES "house"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "receipt" DROP CONSTRAINT "FK_b7a28c22e11b011a67c8626350d"`);
        await queryRunner.query(`ALTER TABLE "receipt" DROP CONSTRAINT "FK_6ec629463c9fd41c8a97d46fa42"`);
        await queryRunner.query(`DROP TABLE "receipt"`);
    }

}
