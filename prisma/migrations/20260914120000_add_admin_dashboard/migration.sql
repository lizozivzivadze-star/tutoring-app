-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'admin';

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "identityEmail" TEXT NOT NULL,
    "notificationEmail" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "teacherInviteCode" TEXT NOT NULL DEFAULT '',
    "defaultTestInstruction" TEXT,
    "notFoundEmailText" TEXT NOT NULL DEFAULT 'ეს ელფოსტა სისტემაში ვერ მოიძებნა',
    "magicLinkSubject" TEXT NOT NULL DEFAULT 'შესვლის ბმული',
    "magicLinkBodyText" TEXT NOT NULL DEFAULT 'თქვენი {roleLabel} ანგარიშზე შესასვლელად გადადით ბმულზე (მოქმედია 15 წუთი):

{url}

თუ ეს მოთხოვნა თქვენ არ გაგზავნიათ, უბრალოდ იგნორირება გაუკეთეთ ამ წერილს.',
    "themeDeleteConfirmText" TEXT NOT NULL DEFAULT 'დარწმუნებული ხარ, რომ გინდა „{name}“-ის წაშლა? წაიშლება მასში არსებული ყველა ტესტიც.',
    "groupDeleteConfirmText" TEXT NOT NULL DEFAULT 'დარწმუნებული ხარ, რომ გინდა „{name}“-ის წაშლა?',
    "studentDeleteConfirmText" TEXT NOT NULL DEFAULT 'დარწმუნებული ხარ, რომ გინდა ამ მოსწავლის წაშლა?',
    "siteTitle" TEXT NOT NULL DEFAULT 'რეპეტიტორის პლატფორმა',
    "siteDescription" TEXT NOT NULL DEFAULT 'ჯგუფების, ტესტებისა და მოსწავლეების მართვის პლატფორმა',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_identityEmail_key" ON "Admin"("identityEmail");
