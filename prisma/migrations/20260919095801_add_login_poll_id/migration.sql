/*
  Warnings:

  - A unique constraint covering the columns `[pollId]` on the table `LoginToken` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "LoginToken" ADD COLUMN     "pollId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "LoginToken_pollId_key" ON "LoginToken"("pollId");
