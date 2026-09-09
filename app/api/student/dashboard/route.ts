import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentStudentId } from "@/lib/current-student";
import { TYPE_LABELS, TestTemplate } from "@/app/dashboard/teacher/tests/types";

export async function GET() {
  const studentId = await getCurrentStudentId();
  if (!studentId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });
  if (!student?.groupId) {
    return NextResponse.json({ pending: [], completed: [] });
  }

  const [sentTests, attempts] = await Promise.all([
    prisma.sentTest.findMany({
      where: { groupId: student.groupId },
      include: { test: { include: { theme: true } } },
      orderBy: { sentAt: "desc" },
    }),
    prisma.testAttempt.findMany({
      where: { studentId },
      include: {
        sentTest: { include: { test: { include: { theme: true } } } },
      },
      orderBy: { completedAt: "desc" },
    }),
  ]);

  const attemptedSentTestIds = new Set(attempts.map((a) => a.sentTestId));

  const pending = sentTests
    .filter((s) => !attemptedSentTestIds.has(s.id))
    .map((s) => ({
      sentTestId: s.id,
      title: s.test.title,
      themeName: s.test.theme.name,
      typeLabel: TYPE_LABELS[s.test.type as TestTemplate],
    }));

  const completed = attempts.map((a) => ({
    attemptId: a.id,
    testTitle: a.sentTest.test.title,
    completedAt: a.completedAt,
    score: a.score,
    totalQuestions: a.totalQuestions,
  }));

  return NextResponse.json({ pending, completed });
}
