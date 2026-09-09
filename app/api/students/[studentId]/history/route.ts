import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/current-teacher";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  // Same ownership shape as /api/students/[studentId]: a student only
  // belongs to a teacher through their current group.
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { group: true },
  });
  if (!student || student.group?.teacherId !== teacherId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const attempts = await prisma.testAttempt.findMany({
    where: { studentId },
    include: {
      sentTest: { include: { test: { include: { theme: true } } } },
    },
    orderBy: { completedAt: "desc" },
  });

  const completed = attempts.map((a) => ({
    attemptId: a.id,
    testTitle: a.sentTest.test.title,
    themeName: a.sentTest.test.theme.name,
    completedAt: a.completedAt,
    score: a.score,
    totalQuestions: a.totalQuestions,
  }));

  return NextResponse.json({ completed });
}
