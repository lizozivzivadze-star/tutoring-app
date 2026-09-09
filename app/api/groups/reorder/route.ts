import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/current-teacher";

export async function POST(req: NextRequest) {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const { orderedIds }: { orderedIds: string[] } = await req.json();
  if (!Array.isArray(orderedIds)) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const owned = await prisma.group.findMany({
    where: { id: { in: orderedIds }, teacherId },
    select: { id: true },
  });
  if (owned.length !== orderedIds.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.group.update({
        where: { id },
        data: { order: index },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
