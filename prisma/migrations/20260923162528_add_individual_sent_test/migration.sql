-- AlterTable
ALTER TABLE "SentTest" ADD COLUMN     "studentId" TEXT,
ALTER COLUMN "groupId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "SentTest_studentId_idx" ON "SentTest"("studentId");

-- AddForeignKey
ALTER TABLE "SentTest" ADD CONSTRAINT "SentTest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
