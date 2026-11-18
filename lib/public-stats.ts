import { prisma } from "@/lib/prisma";

// შესვლის გვერდის საჯარო სტატისტიკა (იგივე რიცხვები ჩანს აპის შიგნითაც).
// მხოლოდ რაოდენობებს აბრუნებს, პირად მონაცემს არაფერს.
export async function computePublicStats() {
  // საგნის ცალკე მოდელი ჯერ არ გვაქვს; ამჟამად საგანი ერთია (ისტორია).
  // როცა საგნები დაემატება, აქ ბაზიდან ვთვლით.
  const subjects = 1;

  // სტატისტიკიდან გამოსარიცხი სატესტო ანგარიშები.
  // ტესტები/შეკითხვები: ამ ტესტერების ტესტები არ ითვლება.
  const EXCLUDED_TEST_AUTHORS = ["lizozivzivadze.test@gmail.com"];
  // მასწავლებლები / გაგზავნილი / გაკეთებული / აბიტურიენტები:
  // ამ ანგარიშების ჯგუფებიდან გაგზავნილი ტესტები არ ითვლება.
  const EXCLUDED_TEACHERS = [
    "tariel.zivzivadze@gmail.com",
    "lizozivzivadze.teacher@gmail.com",
  ];
  const EXCLUDED_TESTERS = [
    "lizozivzivadze.test@gmail.com",
    "tariel.zivzivadze.tester@gmail.com",
  ];

  // ვითვლით მხოლოდ იმ გამოქვეყნებულ ტესტებს, რომლებსაც მასწავლებლები ხედავენ
  // (ტესტერს აქვს მასწავლებლებთან წვდომა), სატესტო ანგარიშების გარდა.
  const visible = {
    published: true,
    theme: {
      tester: {
        teacherAccess: { some: {} },
        identityEmail: { notIn: EXCLUDED_TEST_AUTHORS },
      },
    },
  };

  // ჯგუფი ითვლება, თუ არც სატესტო მასწავლებელს ეკუთვნის და არც სატესტო ტესტერს.
  const countedGroup = {
    NOT: [
      { teacher: { email: { in: EXCLUDED_TEACHERS } } },
      { tester: { identityEmail: { in: EXCLUDED_TESTERS } } },
    ],
  };

  // გაგზავნილი ტესტი ითვლება, თუ მისი ჯგუფი (ინდივიდუალურად
  // გაგზავნისას — მოსწავლის ჯგუფი) ითვლება.
  const countedSent = {
    OR: [
      { group: countedGroup },
      { groupId: null, student: { group: countedGroup } },
    ],
  };

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
      prisma.teacher.count({
        where: { email: { notIn: EXCLUDED_TEACHERS }, groups: { some: hasSent } },
      }),
      prisma.tester.count({
        where: { identityEmail: { notIn: EXCLUDED_TESTERS }, groups: { some: hasSent } },
      }),
      prisma.sentTest.count({ where: countedSent }),
      prisma.testAttempt.count({ where: { superseded: false, sentTest: countedSent } }),
      prisma.testAttempt
        .groupBy({ by: ["studentId"], where: { superseded: false, sentTest: countedSent } })
        .then((rows) => rows.length),
    ]);

  return {
    subjects,
    tests,
    questions,
    teachers: teachers + testers,
    sentTests,
    attempts,
    students,
  };
}
