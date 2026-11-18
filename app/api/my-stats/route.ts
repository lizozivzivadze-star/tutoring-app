import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId, getCurrentTesterId } from "@/lib/current-teacher";
import { getCurrentStudentId } from "@/lib/current-student";
import { computePublicStats } from "@/lib/public-stats";

export const dynamic = "force-dynamic";

// აპის შიგნით ნაჩვენები სტატისტიკა: საერთო რიცხვები (იგივე, რაც შესვლის
// გვერდზე) + ამ მომხმარებლის პირადი რიცხვები.
export async function GET() {
  const studentId = await getCurrentStudentId();
  if (studentId) {
    const [student, global, mine] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId }, select: { name: true } }),
      computePublicStats(),
      // გამეორებული ტესტი ერთხელ ითვლება (ბოლო შედეგი)
      prisma.testAttempt.count({ where: { studentId, superseded: false } }),
    ]);
    return NextResponse.json({
      role: "student",
      name: student?.name ?? null,
      students: global.students,
      attempts: global.attempts,
      myAttempts: mine,
    });
  }

  const testerId = await getCurrentTesterId();
  const teacherId = testerId ? null : await getCurrentTeacherId();
  if (!testerId && !teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const owner = testerId ? { testerId } : { teacherId: teacherId! };
  const [person, global, sent] = await Promise.all([
    testerId
      ? prisma.tester.findUnique({ where: { id: testerId }, select: { name: true } })
      : prisma.teacher.findUnique({ where: { id: teacherId! }, select: { name: true } }),
    computePublicStats(),
    // ჩემი გაგზავნილი ტესტები: ინდივიდუალური ან ჯგუფზე გაგზავნილი
    prisma.sentTest.findMany({
      where: { OR: [{ group: owner }, { student: { group: owner } }] },
      select: {
        studentId: true,
        group: { select: { students: { select: { id: true } } } },
      },
    }),
  ]);

  // ჯგუფზე გაგზავნისას თითო მოსწავლე ცალკე ითვლება
  const students = new Set<string>();
  let mySent = 0;
  for (const s of sent) {
    if (s.studentId) {
      students.add(s.studentId);
      mySent += 1;
    } else if (s.group) {
      for (const st of s.group.students) students.add(st.id);
      mySent += s.group.students.length;
    }
  }

  return NextResponse.json({
    role: "staff",
    name: person?.name ?? null,
    teachers: global.teachers,
    sentTests: global.sentTests,
    myStudents: students.size,
    mySent,
  });
}
