import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ლიზის სატესტო მასწავლებლის ანგარიში: შესვლა
// lizozivzivadze.teacher@gmail.com-ით, მეილი კი მიდის
// lizozivzivadze@gmail.com-ზე. ტესტების სანახავად ყველა არსებულ
// ტესტერზე წვდომას ვაძლევთ (TesterTeacherAccess).
async function main() {
  const email = "lizozivzivadze.teacher@gmail.com";
  const notificationEmail = "lizozivzivadze@gmail.com";

  const teacher = await prisma.teacher.upsert({
    where: { email },
    update: { notificationEmail },
    create: { email, notificationEmail, name: "Lizi" },
  });

  const testers = await prisma.tester.findMany({ select: { id: true, identityEmail: true } });
  for (const tester of testers) {
    await prisma.testerTeacherAccess.upsert({
      where: { testerId_teacherId: { testerId: tester.id, teacherId: teacher.id } },
      update: {},
      create: { testerId: tester.id, teacherId: teacher.id },
    });
  }

  console.log(`teacher ready: ${teacher.email} -> mail to ${teacher.notificationEmail}`);
  console.log(`tests visible from testers: ${testers.map((t) => t.identityEmail).join(", ") || "(none)"}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
