import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const identityEmail = "lizozivzivadze.test@gmail.com";
  const notificationEmail = "lizozivzivadze@gmail.com";

  const tester = await prisma.tester.upsert({
    where: { identityEmail },
    update: { notificationEmail },
    create: { identityEmail, notificationEmail, name: "Lizi" },
  });

  console.log(`tester ready: ${tester.identityEmail} -> mail to ${tester.notificationEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());