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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
