-- AlterTable
ALTER TABLE "TestAttempt" ADD COLUMN "superseded" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN "retakeLimit" INTEGER;
