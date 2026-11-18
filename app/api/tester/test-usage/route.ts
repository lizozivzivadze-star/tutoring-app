import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTesterId } from "@/lib/current-teacher";
import { countedAttemptWhere } from "@/lib/test-usage";

// ტესტერის ყოველი ტესტისთვის: ჯამში რამდენჯერ გაკეთდა (გამეორებების ჩათვლით)
export async function GET() {
  const testerId = await getCurrentTesterId();
  if (!testerId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }
  const tester = await prisma.tester.findUnique({ where: { id: testerId } });
  if (!tester) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const attempts = await prisma.testAttempt.findMany({
    where: {
      AND: [
        { sentTest: { test: { theme: { testerId } } } },
        countedAttemptWhere(tester.identityEmail),
      ],
    },
    select: { sentTest: { select: { testId: true } } },
  });

  const counts: Record<string, number> = {};
  for (const a of attempts) {
    const id = a.sentTest.testId;
    counts[id] = (counts[id] ?? 0) + 1;
  }

  return NextResponse.json({ counts });
}
