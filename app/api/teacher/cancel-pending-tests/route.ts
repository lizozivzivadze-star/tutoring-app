import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/current-teacher";

export async function POST() {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const toCancel = await prisma.sentTest.findMany({
    where: {
      attempts: { none: {} },
      OR: [
        { group: { teacherId } },
        { student: { group: { teacherId } } },
      ],
    },
    select: {
      id: true,
      test: { select: { title: true } },
      group: { select: { name: true } },
      student: {
        select: { name: true, surname: true, group: { select: { name: true } } },
      },
    },
  });

  await prisma.sentTest.deleteMany({
    where: { id: { in: toCancel.map((t) => t.id) } },
  });

  return NextResponse.json({
    cancelled: toCancel.map((t) => ({
      testTitle: t.test.title,
      groupName: t.group?.name ?? t.student?.group?.name ?? null,
      studentName: t.student
        ? [t.student.name, t.student.surname].filter(Boolean).join(" ")
        : null,
    })),
  });
}