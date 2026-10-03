import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/current-teacher";

export async function GET() {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const rows = await prisma.sentTest.findMany({
    where: {
      attempts: { none: {} },
      OR: [{ group: { teacherId } }, { student: { group: { teacherId } } }],
    },
    orderBy: { sentAt: "desc" },
    select: {
      id: true,
      sentAt: true,
      test: { select: { title: true } },
      group: { select: { name: true } },
      student: { select: { name: true, surname: true } },
    },
  });

  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id,
      sentAt: r.sentAt.toISOString(),
      title: r.test.title,
      target: r.student
        ? [r.student.name, r.student.surname].filter(Boolean).join(" ") || "—"
        : r.group?.name ?? "—",
    })),
  });
}

export async function DELETE(req: NextRequest) {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const { id } = await req.json().catch(() => ({}));
  if (!id) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const result = await prisma.sentTest.deleteMany({
    where: {
      id,
      attempts: { none: {} },
      OR: [{ group: { teacherId } }, { student: { group: { teacherId } } }],
    },
  });
  if (result.count === 0) {
    return NextResponse.json(
      { error: "ტესტის წაშლა ვერ მოხერხდა (შესაძლოა მოსწავლემ უკვე დაასრულა)" },
      { status: 409 }
    );
  }
  return NextResponse.json({ ok: true });
}