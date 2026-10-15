import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// login გვერდის საჯარო სტატისტიკა. მხოლოდ რაოდენობებს აბრუნებს,
// პირად მონაცემს არაფერს.
export async function GET() {
  const [subjects, tests, questions, teachers, sentTests, attempts, students] =
    await Promise.all([
      prisma.theme.count({ where: { tests: { some: { published: true } } } }),
      prisma.test.count({ where: { published: true } }),
      prisma.question.count({ where: { test: { published: true } } }),
      prisma.teacher.count(),
      prisma.sentTest.count(),
      prisma.testAttempt.count(),
      prisma.testAttempt
        .groupBy({ by: ["studentId"] })
        .then((rows) => rows.length),
    ]);

  return NextResponse.json(
    { subjects, tests, questions, teachers, sentTests, attempts, students },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}