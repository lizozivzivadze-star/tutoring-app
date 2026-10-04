import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTesterId } from "@/lib/current-teacher";

export async function POST(req: NextRequest) {
  const testerId = await getCurrentTesterId();
  if (!testerId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const { groupId, studentId, testId, timerEnabled, allowBack } = await req.json();
  const settings = {
  timerEnabled: timerEnabled !== false,
  allowBack: timerEnabled === false ? Boolean(allowBack) : false,
};
  if (!testId || (!groupId && !studentId) || (groupId && studentId)) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: { theme: true },
  });
  if (!test || test.theme.testerId !== testerId) {
    return NextResponse.json({ error: "ტესტი ვერ მოიძებნა" }, { status: 404 });
  }
  if (!test.published) {
    return NextResponse.json(
      { error: "გამოუქვეყნებელი ტესტის გაგზავნა არ შეიძლება" },
      { status: 400 }
    );
  }

  if (studentId) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { group: true },
    });
    if (!student || student.group?.testerId !== testerId) {
      return NextResponse.json({ error: "მოსწავლე ვერ მოიძებნა" }, { status: 404 });
    }
    const sentTest = await prisma.sentTest.create({ data: { studentId, testId, ...settings } })
    return NextResponse.json({ sentTest });
  }

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.testerId !== testerId) {
    return NextResponse.json({ error: "ჯგუფი ვერ მოიძებნა" }, { status: 404 });
  }
  const students = await prisma.student.findMany({
    where: { groupId },
    select: { id: true },
  });
  if (students.length === 0) {
    return NextResponse.json(
      { error: "ჯგუფში მოსწავლე არ არის დამატებული, ტესტი ვერ გაიგზავნება" },
      { status: 400 }
    );
  }

  const sentAt = new Date();
  const result = await prisma.sentTest.createMany({
    data: students.map((s) => ({ studentId: s.id, testId, sentAt, ...settings })),
  });
  return NextResponse.json({ count: result.count });
}