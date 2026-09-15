-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'tester';

-- CreateTable
CREATE TABLE "Tester" (
    "id" TEXT NOT NULL,
    "identityEmail" TEXT NOT NULL,
    "notificationEmail" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tester_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tester_identityEmail_key" ON "Tester"("identityEmail");

-- AlterTable
ALTER TABLE "Group" ALTER COLUMN "teacherId" DROP NOT NULL;
ALTER TABLE "Group" ADD COLUMN "testerId" TEXT;

-- CreateIndex
CREATE INDEX "Group_testerId_idx" ON "Group"("testerId");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_testerId_fkey" FOREIGN KEY ("testerId") REFERENCES "Tester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Theme" DROP CONSTRAINT IF EXISTS "Theme_teacherId_fkey";
DROP INDEX IF EXISTS "Theme_teacherId_idx";
ALTER TABLE "Theme" DROP COLUMN "teacherId";
ALTER TABLE "Theme" ADD COLUMN "testerId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Theme_testerId_idx" ON "Theme"("testerId");

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_testerId_fkey" FOREIGN KEY ("testerId") REFERENCES "Tester"("id") ON DELETE CASCADE ON UPDATE CASCADE;
