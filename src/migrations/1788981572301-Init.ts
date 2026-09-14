import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1788981572301 implements MigrationInterface {
    name = 'Init1788981572301'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "house" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "adress" character varying NOT NULL, "name" character varying NOT NULL, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4428c5d9c879a54f244bdfa0be8" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE TYPE "public"."house_user_role_enum" AS ENUM('admin', 'member')`);
        await queryRunner.query(`CREATE TABLE "house_user" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "public"."house_user_role_enum" NOT NULL DEFAULT 'member', "userUuid" uuid, "houseUuid" uuid, CONSTRAINT "UQ_511f3722777bd311d5a355f6272" UNIQUE ("userUuid", "houseUuid"), CONSTRAINT "PK_c83f6f1ceefede164e5656c3905" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE TABLE "user" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "hashedRefreshToken" character varying, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a95e949168be7b7ece1a2382fed" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`ALTER TABLE "house_user" ADD CONSTRAINT "FK_1f7401372d4e69f468cee2b3f35" FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "house_user" ADD CONSTRAINT "FK_c9c4e956552ba61e33af1f75659" FOREIGN KEY ("houseUuid") REFERENCES "house"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "house_user" DROP CONSTRAINT "FK_c9c4e956552ba61e33af1f75659"`);
        await queryRunner.query(`ALTER TABLE "house_user" DROP CONSTRAINT "FK_1f7401372d4e69f468cee2b3f35"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "house_user"`);
        await queryRunner.query(`DROP TYPE "public"."house_user_role_enum"`);
        await queryRunner.query(`DROP TABLE "house"`);
    }

}
