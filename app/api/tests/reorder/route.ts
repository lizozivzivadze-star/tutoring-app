import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTesterId } from "@/lib/current-teacher";

// ტესტების რიგის შეცვლა ერთი თემის ერთი ტიპის შიგნით (ტესტერი).
export async function POST(req: NextRequest) {
  const testerId = await getCurrentTesterId();
  if (!testerId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const { orderedIds }: { orderedIds: string[] } = await req.json();
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const owned = await prisma.test.findMany({
    where: { id: { in: orderedIds }, theme: { testerId } },
    select: { id: true, themeId: true, type: true, updatedAt: true },
  });
  if (owned.length !== orderedIds.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  // ყველა ერთი თემისა და ერთი ტიპის უნდა იყოს
  const first = owned[0];
  if (owned.some((t) => t.themeId !== first.themeId || t.type !== first.type)) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  // updatedAt-ს ძველ მნიშვნელობას ვუნარჩუნებთ: რიგის შეცვლა ტესტის
  // შიგთავსის ცვლილება არ არის და ტესტი "draft"-ად არ უნდა გამოჩნდეს
  // (hasUnpublishedEdits = updatedAt > publishedAt).
  const updatedAtById = new Map(owned.map((t) => [t.id, t.updatedAt]));
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.test.update({
        where: { id },
        data: { order: index, updatedAt: updatedAtById.get(id) },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
