import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentStudentId } from "@/lib/current-student";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;
  const studentId = await getCurrentStudentId();
  if (!studentId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      student: true,
      answers: true,
      sentTest: {
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
      },
    },
  });

  if (!attempt || attempt.studentId !== studentId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const answerByQuestion = new Map(
    attempt.answers.map((a) => [a.questionId, a.selectedOptionId])
  );

  return NextResponse.json({
    attemptId: attempt.id,
    testTitle: attempt.sentTest.test.title,
    completedAt: attempt.completedAt,
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    studentEmail: attempt.student.email,
    questions: attempt.sentTest.test.questions.map((q) => {
      const selectedOptionId = answerByQuestion.get(q.id) ?? null;
      const correctOption = q.options.find((o) => o.isCorrect);
      const selectedOption = q.options.find((o) => o.id === selectedOptionId);
      return {
        id: q.id,
        prompt: q.prompt,
        correctAnswer: correctOption?.text ?? "",
        yourAnswer: selectedOption?.text ?? "(პასუხის გარეშე)",
      };
    }),
  });
}
