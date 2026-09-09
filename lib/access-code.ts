import { prisma } from "@/lib/prisma";

export async function generateAccessCode(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const exists = await prisma.student.findUnique({
      where: { accessCode: code },
    });
    if (!exists) return code;
  }
  throw new Error("could not generate a unique access code");
}
