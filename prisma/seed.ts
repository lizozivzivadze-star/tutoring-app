import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// This is the only path that creates a Teacher record. There is no
// public "register as teacher" route in the app — that's the whole
// point: a student can never become, or reach, a teacher account.
//
// Run once at setup time:
//   npx prisma db seed
//
// To add another teacher later, edit this list and re-run — it's
// idempotent (upsert), so it's safe to run again.
async function main() {
  const teachers = [
    {
      email: process.env.SEED_TEACHER_EMAIL ?? "natia@example.com",
      name: process.env.SEED_TEACHER_NAME ?? "ნათია",
    },
  ];

  for (const t of teachers) {
    await prisma.teacher.upsert({
      where: { email: t.email },
      update: { name: t.name },
      create: t,
    });
    console.log(`[seed] teacher ready: ${t.email}`);
  }

  // Admin is only ever created here — same reasoning as teachers
  // above, just one level up. identityEmail is what gets typed on
  // the shared login form; notificationEmail is the real inbox the
  // magic-link mail lands in (can be any address, including one
  // that's already a Teacher/Student's own email — it plays no part
  // in role resolution).
  const admin = {
    identityEmail: process.env.SEED_ADMIN_IDENTITY_EMAIL ?? "lizozivzivadze123@gmail.com",
    notificationEmail: process.env.SEED_ADMIN_NOTIFICATION_EMAIL ?? "lizozivzivadze@gmail.com",
    name: process.env.SEED_ADMIN_NAME ?? "Lizi",
  };

  await prisma.admin.upsert({
    where: { identityEmail: admin.identityEmail },
    update: { notificationEmail: admin.notificationEmail, name: admin.name },
    create: admin,
  });
  console.log(`[seed] admin ready: ${admin.identityEmail} -> mail to ${admin.notificationEmail}`);

  const testers = [
    {
      identityEmail: process.env.SEED_TESTER1_IDENTITY_EMAIL ?? "tariel.zivzivadze.tester@gmail.com",
      notificationEmail: process.env.SEED_TESTER1_NOTIFICATION_EMAIL ?? "tariel.zivzivadze@gmail.com",
      name: process.env.SEED_TESTER1_NAME ?? "Tariel",
    },
    {
      identityEmail: process.env.SEED_TESTER2_IDENTITY_EMAIL ?? "lizozivzivadze.tester@gmail.com",
      notificationEmail: process.env.SEED_TESTER2_NOTIFICATION_EMAIL ?? "lizozivzivadze@gmail.com",
      name: process.env.SEED_TESTER2_NAME ?? "Lizi (tester)",
    },
  ];

  let primaryTester;
  for (const t of testers) {
    const tester = await prisma.tester.upsert({
      where: { identityEmail: t.identityEmail },
      update: { notificationEmail: t.notificationEmail, name: t.name },
      create: t,
    });
    console.log(`[seed] tester ready: ${t.identityEmail} -> mail to ${t.notificationEmail}`);
    if (t.identityEmail === testers[0].identityEmail) primaryTester = tester;
  }

  // ერთჯერადი ჩანაცვლება: ძველი Theme-ები Teacher-ს ეკუთვნოდა,
  // ახლა Tester-ს უნდა ეკუთვნოდეს — ვაბამთ პირველ (tariel) ტესტერზე.
  if (primaryTester) {
    const { count } = await prisma.theme.updateMany({
      where: { testerId: null },
      data: { testerId: primaryTester.id },
    });
    if (count > 0) {
      console.log(`[seed] backfilled ${count} theme(s) onto ${primaryTester.identityEmail}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
