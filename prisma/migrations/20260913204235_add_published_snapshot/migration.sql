-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "publishedSnapshot" JSONB,
ALTER COLUMN "updatedAt" DROP DEFAULT;
