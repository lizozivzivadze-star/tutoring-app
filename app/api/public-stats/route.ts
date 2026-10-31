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
  // (ტესტერს აქვს მასწავლებლებთან წვდომა).
  const visible = {
    published: true,
    theme: { tester: { teacherAccess: { some: {} } } },
  };

  // ითვლება ყველა გაგზავნილი და გაკეთებული ტესტი, მიუხედავად იმისა,
  // მასწავლებლის ჯგუფიდანაა თუ ტესტერის (ტესტერიც მასწავლებლის როლს ასრულებს).
  const hasSent = {
    OR: [
      { sentTests: { some: {} } },
      { students: { some: { sentTests: { some: {} } } } },
    ],
  };

  const [tests, questions, teachers, testers, sentTests, attempts, students] =
    await Promise.all([
      prisma.test.count({ where: visible }),
      prisma.question.count({ where: { test: visible } }),
      prisma.teacher.count({ where: { groups: { some: hasSent } } }),
      prisma.tester.count({ where: { groups: { some: hasSent } } }),
      prisma.sentTest.count(),
      prisma.testAttempt.count(),
      prisma.testAttempt
        .groupBy({ by: ["studentId"] })
        .then((rows) => rows.length),
    ]);

  return NextResponse.json(
    {
      subjects,
      tests,
      questions,
      teachers: teachers + testers,
      sentTests,
      attempts,
      students,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    }
  );
}