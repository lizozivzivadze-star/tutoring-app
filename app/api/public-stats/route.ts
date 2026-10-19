import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// login გვერდის საჯარო სტატისტიკა. მხოლოდ რაოდენობებს აბრუნებს,
// პირად მონაცემს არაფერს.
export async function GET() {
  // საგნის ცალკე მოდელი ჯერ არ გვაქვს; ამჟამად საგანი ერთია (ისტორია).
  // როცა საგნები დაემატება, აქ ბაზიდან ვთვლით.
  const subjects = 1;

  // ვითვლით მხოლოდ იმ გამოქვეყნებულ ტესტებს, რომლებსაც მასწავლებლები ხედავენ
  // (ტესტერს აქვს მასწავლებლებთან წვდომა). სატესტო ანგარიშები არ ითვლება.
  const visible = {
    published: true,
    theme: { tester: { teacherAccess: { some: {} } } },
  };

  const [tests, questions, teachers, sentTests, attempts, students] =
    await Promise.all([
      prisma.test.count({ where: visible }),
      prisma.question.count({ where: { test: visible } }),
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
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    }
  );
}