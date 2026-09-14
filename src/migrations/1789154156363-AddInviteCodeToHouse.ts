import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInviteCodeToHouse1789154156363 implements MigrationInterface {
    name = 'AddInviteCodeToHouse1789154156363'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "house" ADD "inviteCode" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "house" ADD CONSTRAINT "UQ_f4b19681de941a7063d6ccdf7ac" UNIQUE ("inviteCode")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "house" DROP CONSTRAINT "UQ_f4b19681de941a7063d6ccdf7ac"`);
        await queryRunner.query(`ALTER TABLE "house" DROP COLUMN "inviteCode"`);
    }

}
