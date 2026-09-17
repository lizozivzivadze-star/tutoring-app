import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTesterId } from "@/lib/current-teacher";

async function assertOwnership(themeId: string, testerId: string) {
  const theme = await prisma.theme.findUnique({ where: { id: themeId } });
  return theme && theme.testerId === testerId ? theme : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ themeId: string }> }
) {
  const { themeId } = await params;
  const testerId = await getCurrentTesterId();
  if (!testerId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const owned = await assertOwnership(themeId, testerId);
  if (!owned) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "სახელი აუცილებელია" }, { status: 400 });
  }

  const theme = await prisma.theme.update({
    where: { id: themeId },
    data: { name: name.trim() },
  });

  return NextResponse.json({ theme });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ themeId: string }> }
) {
  const { themeId } = await params;
  const testerId = await getCurrentTesterId();
  if (!testerId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const owned = await assertOwnership(themeId, testerId);
  if (!owned) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Deletable unconditionally — cascades to Test → Question/Option
  // and (via Test's own cascade) SentTest/TestAttempt/AttemptAnswer,
  // so every test under this theme disappears with it, sent or not.
  await prisma.theme.delete({ where: { id: themeId } });

  return NextResponse.json({ ok: true });
}
