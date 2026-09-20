import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/current-teacher";

export async function POST(req: NextRequest) {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const { groupId, testId } = await req.json();
  if (!groupId || !testId) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const [group, test] = await Promise.all([
    prisma.group.findUnique({ where: { id: groupId } }),
    prisma.test.findUnique({ where: { id: testId }, include: { theme: true } }),
  ]);

  if (!group || group.teacherId !== teacherId) {
    return NextResponse.json({ error: "ჯგუფი ვერ მოიძებნა" }, { status: 404 });
  }
  if (!test) {
    return NextResponse.json({ error: "ტესტი ვერ მოიძებნა" }, { status: 404 });
  }
  const hasAccess = await prisma.testerTeacherAccess.findUnique({
    where: {
      testerId_teacherId: { testerId: test.theme.testerId, teacherId },
    },
  });
  if (!hasAccess) {
    return NextResponse.json({ error: "ტესტი ვერ მოიძებნა" }, { status: 404 });
  }
  if (!test.published) {
    return NextResponse.json(
      { error: "გამოუქვეყნებელი ტესტის გაგზავნა არ შეიძლება" },
      { status: 400 }
    );
  }
  const studentCount = await prisma.student.count({ where: { groupId } });
if (studentCount === 0) {
  return NextResponse.json(
    { error: "ჯგუფში მოსწავლე არ არის დამატებული, ტესტი ვერ გაიგზავნება" },
    { status: 400 }
  );
}

  const sentTest = await prisma.sentTest.create({
    data: { groupId, testId },
  });

  return NextResponse.json({ sentTest });
}
