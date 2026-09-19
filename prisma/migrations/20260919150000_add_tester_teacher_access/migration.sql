-- CreateTable
CREATE TABLE "TesterTeacherAccess" (
    "id" TEXT NOT NULL,
    "testerId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TesterTeacherAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TesterTeacherAccess_teacherId_idx" ON "TesterTeacherAccess"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "TesterTeacherAccess_testerId_teacherId_key" ON "TesterTeacherAccess"("testerId", "teacherId");

-- AddForeignKey
ALTER TABLE "TesterTeacherAccess" ADD CONSTRAINT "TesterTeacherAccess_testerId_fkey" FOREIGN KEY ("testerId") REFERENCES "Tester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TesterTeacherAccess" ADD CONSTRAINT "TesterTeacherAccess_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
