import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentStudentId } from "@/lib/current-student";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sentTestId: string }> }
) {
  const { sentTestId } = await params;
  const studentId = await getCurrentStudentId();
  if (!studentId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });

  const sentTest = await prisma.sentTest.findUnique({
    where: { id: sentTestId },
    include: {
      test: {
        include: {
          questions: {
            orderBy: { order: "asc" },
            include: { options: { orderBy: { order: "asc" } } },
          },
        },
      },
    },
  });

  if (!sentTest || !student?.groupId || sentTest.groupId !== student.groupId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const existingAttempt = await prisma.testAttempt.findFirst({
    where: { sentTestId, studentId },
  });
  if (existingAttempt) {
    return NextResponse.json(
      { error: "already completed", attemptId: existingAttempt.id },
      { status: 409 }
    );
  }

  return NextResponse.json({
    sentTestId: sentTest.id,
    title: sentTest.test.title,
    instruction: sentTest.test.instruction,
    questions: sentTest.test.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      // Correct-answer info is intentionally left out — this is the
      // taking view, not the teacher's editor.
      options: q.options.map((o) => ({ id: o.id, text: o.text })),
    })),
  });
}
