import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/current-teacher";

export async function GET() {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const attempts = await prisma.testAttempt.findMany({
    where: {
      sentTest: {
        OR: [{ group: { teacherId } }, { student: { group: { teacherId } } }],
      },
    },
    orderBy: [{ sentTest: { sentAt: "desc" } }, { completedAt: "desc" }],
    select: {
      sentTestId: true,
      score: true,
      totalQuestions: true,
      sentTest: {
        select: {
          id: true,
          testId: true,
          sentAt: true,
          groupId: true,
          test: { select: { title: true } },
        },
      },
      student: {
        select: {
          id: true,
          name: true,
          surname: true,
          order: true,
          group: { select: { id: true, name: true, order: true } },
        },
      },
    },
  });

  const seen = new Set<string>();
  const rows: Record<string, unknown>[] = [];
  for (const a of attempts) {
    const key = `${a.sentTestId}:${a.student.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const st = a.sentTest;
    rows.push({
      eventKey: st.groupId ? st.id : `${st.testId}|${st.sentAt.toISOString()}`,
      sentAt: st.sentAt.toISOString(),
      testId: st.testId,
      testTitle: st.test.title,
      groupId: a.student.group?.id ?? null,
      groupName: a.student.group?.name ?? "ჯგუფის გარეშე",
      groupOrder: a.student.group?.order ?? 9999,
      studentId: a.student.id,
      studentName:
        [a.student.name, a.student.surname].filter(Boolean).join(" ") || "—",
      studentOrder: a.student.order,
      score: a.score,
      total: a.totalQuestions,
    });
  }

  return NextResponse.json({ rows });
}