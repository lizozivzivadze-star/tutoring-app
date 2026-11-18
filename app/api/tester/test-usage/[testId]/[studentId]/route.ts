import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTesterId } from "@/lib/current-teacher";
import { countedAttemptWhere } from "@/lib/test-usage";

// მოსწავლის ყველა გაკეთებული ტესტი (ბოლო შედეგით), ახლიდან ძველისკენ.
// მოსწავლე ჩანს მხოლოდ მაშინ, თუ ამ ტესტერის ამ ტესტს აკეთებს.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ testId: string; studentId: string }> }
) {
  const { testId, studentId } = await params;
  const testerId = await getCurrentTesterId();
  if (!testerId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }
  const tester = await prisma.tester.findUnique({ where: { id: testerId } });
  if (!tester) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const allowed = await prisma.testAttempt.findFirst({
    where: {
      AND: [
        { studentId, sentTest: { testId, test: { theme: { testerId } } } },
        countedAttemptWhere(tester.identityEmail),
      ],
    },
    select: {
      student: { select: { name: true, surname: true } },
    },
  });
  if (!allowed) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const attempts = await prisma.testAttempt.findMany({
    where: { studentId, superseded: false },
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      score: true,
      totalQuestions: true,
      sentTest: { select: { test: { select: { title: true } } } },
    },
  });

  return NextResponse.json({
    studentName:
      [allowed.student.name, allowed.student.surname].filter(Boolean).join(" ") ||
      "—",
    tests: attempts.map((a) => ({
      id: a.id,
      title: a.sentTest.test.title,
      score: a.score,
      total: a.totalQuestions,
    })),
  });
}
