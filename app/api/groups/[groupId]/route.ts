import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/current-teacher";

async function assertOwnership(groupId: string, teacherId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  return group && group.teacherId === teacherId ? group : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const owned = await assertOwnership(groupId, teacherId);
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
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const owned = await assertOwnership(groupId, teacherId);
  if (!owned) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Students in the group are kept (their groupId is cleared, per the
  // schema's onDelete: SetNull) rather than deleted, so removing a
  // group by mistake can't wipe out student records with it.
  await prisma.group.delete({ where: { id: groupId } });

  return NextResponse.json({ ok: true });
}
