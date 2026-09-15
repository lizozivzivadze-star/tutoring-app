import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTesterId } from "@/lib/current-teacher";

export async function POST(req: NextRequest) {
  const testerId = await getCurrentTesterId();
  if (!testerId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const { orderedIds }: { orderedIds: string[] } = await req.json();
  if (!Array.isArray(orderedIds)) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const owned = await prisma.group.findMany({
    where: { id: { in: orderedIds }, testerId },
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