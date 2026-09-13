-- AlterTable
ALTER TABLE "Test" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Test" ADD COLUMN "publishedAt" TIMESTAMP(3);

UPDATE "Test" SET "publishedAt" = "createdAt" WHERE "published" = true;