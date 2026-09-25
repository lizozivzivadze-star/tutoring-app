import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Only the admin account is seeded here. identityEmail is what gets
// typed on the shared login form; notificationEmail is the real
// inbox the magic-link mail lands in.
//
// Run once:
//   npx prisma db seed
async function main() {
  const admin = {
    identityEmail: process.env.SEED_ADMIN_IDENTITY_EMAIL ?? "lizozivzivadze.admin@gmail.com",
    notificationEmail: process.env.SEED_ADMIN_NOTIFICATION_EMAIL ?? "lizozivzivadze@gmail.com",
    name: process.env.SEED_ADMIN_NAME ?? "Lizi",
  };

  await prisma.admin.upsert({
    where: { identityEmail: admin.identityEmail },
    update: { notificationEmail: admin.notificationEmail, name: admin.name },
    create: admin,
  });
  console.log(`[seed] admin ready: ${admin.identityEmail} -> mail to ${admin.notificationEmail}`);

  // Two teachers, plus one tester whose tests should show up only in
  // these two teachers' "აირჩიე ტესტი" list (TesterTeacherAccess
  // below), not for any other teacher.
  const teacher1 = await prisma.teacher.upsert({
    where: { email: "tariel.zivzivadze@gmail.com" },
    update: {},
    create: { email: "tariel.zivzivadze@gmail.com" },
  });
  console.log(`[seed] teacher ready: ${teacher1.email}`);

  const teacher2 = await prisma.teacher.upsert({
    where: { email: "n.deisadze@gmail.com" },
    update: {},
    create: { email: "n.deisadze@gmail.com" },
  });
  console.log(`[seed] teacher ready: ${teacher2.email}`);

  const tester = await prisma.tester.upsert({
    where: { identityEmail: "tariel.zivzivadze.tester@gmail.com" },
    update: { notificationEmail: "tariel.zivzivadze@gmail.com" },
    create: {
      identityEmail: "tariel.zivzivadze.tester@gmail.com",
      notificationEmail: "tariel.zivzivadze@gmail.com",
    },
  });
  console.log(`[seed] tester ready: ${tester.identityEmail} -> mail to ${tester.notificationEmail}`);

  const tester2 = await prisma.tester.upsert({
    where: { identityEmail: "azivzivadze11.tester@gmail.com" },
    update: { notificationEmail: "azivzivadze11@gmail.com" },
    create: {
      identityEmail: "azivzivadze11.tester@gmail.com",
      notificationEmail: "azivzivadze11@gmail.com",
    },
  });
  console.log(`[seed] tester ready: ${tester2.identityEmail} -> mail to ${tester2.notificationEmail}`);

  for (const teacher of [teacher1, teacher2]) {
    await prisma.testerTeacherAccess.upsert({
      where: {
        testerId_teacherId: { testerId: tester.id, teacherId: teacher.id },
      },
      update: {},
      create: { testerId: tester.id, teacherId: teacher.id },
    });
    console.log(`[seed] access ready: ${tester.identityEmail} -> ${teacher.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
