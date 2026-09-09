import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentStudentId } from "@/lib/current-student";

export async function POST(req: NextRequest) {
  const studentId = await getCurrentStudentId();
  if (!studentId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const {
    sentTestId,
    answers,
  }: {
    sentTestId: string;
    answers: { questionId: string; selectedOptionId: string | null }[];
  } = await req.json();

  if (!sentTestId || !Array.isArray(answers)) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });

  const sentTest = await prisma.sentTest.findUnique({
    where: { id: sentTestId },
    include: {
      test: {
        include: {
          questions: { include: { options: true } },
        },
      },
    },
  });

  if (!sentTest || !student?.groupId || sentTest.groupId !== student.groupId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const existing = await prisma.testAttempt.findFirst({
    where: { sentTestId, studentId },
  });
  if (existing) {
    return NextResponse.json({ attempt: existing });
  }

  // Score is computed here from the stored correct options — never
  // taken from the client — so nothing about scoring can be spoofed
  // by editing the request.
  let score = 0;
  const answerByQuestion = new Map(
    answers.map((a) => [a.questionId, a.selectedOptionId])
  );

  for (const question of sentTest.test.questions) {
    const selectedOptionId = answerByQuestion.get(question.id) ?? null;
    const correctOption = question.options.find((o) => o.isCorrect);
    if (selectedOptionId && correctOption?.id === selectedOptionId) {
      score += 1;
    }
  }

  const attempt = await prisma.testAttempt.create({
    data: {
      sentTestId,
      studentId,
      score,
      totalQuestions: sentTest.test.questions.length,
      answers: {
        create: sentTest.test.questions.map((q) => ({
          questionId: q.id,
          selectedOptionId: answerByQuestion.get(q.id) ?? null,
        })),
      },
    },
  });

  return NextResponse.json({ attempt });
}
