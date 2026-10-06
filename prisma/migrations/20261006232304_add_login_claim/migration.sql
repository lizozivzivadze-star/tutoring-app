-- AlterTable
ALTER TABLE "LoginToken" ADD COLUMN     "claimedAt" TIMESTAMP(3),
ADD COLUMN     "pollSecret" TEXT;
