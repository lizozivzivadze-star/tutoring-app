-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "activated" BOOLEAN NOT NULL DEFAULT false;
UPDATE "Test" SET "activated" = true WHERE "published" = true;