import { prisma } from "@/lib/prisma";

// true, თუ ეს email უკვე არის მასწავლებლის, ადმინის ან ტესტერის
// შესვლის email (დიდი/პატარა ასოების გარჩევის გარეშე).
export async function isStaffEmail(email: string): Promise<boolean> {
  const ci = { equals: email, mode: "insensitive" as const };
  const [teacher, admin, tester] = await Promise.all([
    prisma.teacher.findFirst({ where: { email: ci }, select: { id: true } }),
    prisma.admin.findFirst({ where: { identityEmail: ci }, select: { id: true } }),
    prisma.tester.findFirst({ where: { identityEmail: ci }, select: { id: true } }),
  ]);
  return Boolean(teacher || admin || tester);
}