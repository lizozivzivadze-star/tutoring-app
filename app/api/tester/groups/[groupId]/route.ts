import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTesterId } from "@/lib/current-teacher";

async function assertOwnership(groupId: string, testerId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  return group && group.testerId === testerId ? group : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const testerId = await getCurrentTesterId();
  if (!testerId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const owned = await assertOwnership(groupId, testerId);
  if (!owned) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "სახელი აუცილებელია" }, { status: 400 });
  }

  const group = await prisma.group.update({
    where: { id: groupId },
    data: { name: name.trim() },
  });

  return NextResponse.json({ group });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const testerId = await getCurrentTesterId();
  if (!testerId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const owned = await assertOwnership(groupId, testerId);
  if (!owned) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await prisma.group.delete({ where: { id: groupId } });

  return NextResponse.json({ ok: true });
}