-- AlterTable
ALTER TABLE "LoginToken" ADD COLUMN "register" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN "openRegistration" BOOLEAN NOT NULL DEFAULT false;
