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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
