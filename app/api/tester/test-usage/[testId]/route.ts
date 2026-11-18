import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTesterId } from "@/lib/current-teacher";
import { countedAttemptWhere } from "@/lib/test-usage";

// ვინ გააკეთა ეს ტესტი (თითო მოსწავლე ერთხელ)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const testerId = await getCurrentTesterId();
  if (!testerId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }
  const tester = await prisma.tester.findUnique({ where: { id: testerId } });
  const test = await prisma.test.findUnique({
    where: { id: testId },
    select: { title: true, theme: { select: { testerId: true } } },
  });
  if (!tester || !test || test.theme.testerId !== testerId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const attempts = await prisma.testAttempt.findMany({
    where: {
      AND: [{ sentTest: { testId } }, countedAttemptWhere(tester.identityEmail)],
    },
    select: { student: { select: { id: true, name: true, surname: true } } },
  });

  const byId = new Map<string, string>();
  for (const a of attempts) {
    if (byId.has(a.student.id)) continue;
    byId.set(
      a.student.id,
      [a.student.name, a.student.surname].filter(Boolean).join(" ") || "—"
    );
  }
  const students = Array.from(byId, ([id, name]) => ({ id, name })).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return NextResponse.json({ title: test.title, students });
}
