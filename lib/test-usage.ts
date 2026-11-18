import type { Prisma } from "@prisma/client";

// ტესტერის „ტესტები #" ანგარიში: რომელი გაკეთებები ითვლება.
// ამ ტესტერის ტესტებში ითვლება ყველა გაკეთება (ყალბი მოსწავლეებითაც,
// აპლიკაციის დასატესტად). ყველა სხვა ტესტერის ტესტებში — მხოლოდ რეალური
// მასწავლებლების მოსწავლეებისა (სატესტო ანგარიშების ჯგუფები არ ითვლება,
// იგივე წესი, რაც შესვლის გვერდის სტატისტიკაში).
const COUNT_ALL_TESTERS = ["lizozivzivadze.test@gmail.com"];

const EXCLUDED_TEACHERS = [
  "tariel.zivzivadze@gmail.com",
  "lizozivzivadze.teacher@gmail.com",
];
const EXCLUDED_TESTERS = [
  "lizozivzivadze.test@gmail.com",
  "tariel.zivzivadze.tester@gmail.com",
];

const countedGroup: Prisma.GroupWhereInput = {
  NOT: [
    { teacher: { email: { in: EXCLUDED_TEACHERS } } },
    { tester: { identityEmail: { in: EXCLUDED_TESTERS } } },
  ],
};

/** TestAttempt-ის ფილტრი: რომელი გაკეთებები ჩაითვალოს ამ ტესტერისთვის */
export function countedAttemptWhere(
  testerEmail: string
): Prisma.TestAttemptWhereInput {
  if (COUNT_ALL_TESTERS.includes(testerEmail)) return {};
  return {
    sentTest: {
      OR: [
        { group: countedGroup },
        { groupId: null, student: { group: countedGroup } },
      ],
    },
  };
}
