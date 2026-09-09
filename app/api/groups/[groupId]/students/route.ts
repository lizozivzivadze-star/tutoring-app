import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/current-teacher";
import { generateAccessCode } from "@/lib/access-code";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.teacherId !== teacherId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { name, surname, contact, email } = await req.json();
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json(
      { error: "სახელი და email აუცილებელია" },
      { status: 400 }
    );
  }

  const existing = await prisma.student.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "ეს email უკვე რეგისტრირებულია" },
      { status: 409 }
    );
  }

  const last = await prisma.student.findFirst({
    where: { groupId },
    orderBy: { order: "desc" },
  });

  const student = await prisma.student.create({
    data: {
      name: name.trim(),
      surname: surname?.trim() || null,
      contact: contact?.trim() || null,
      email: email.trim(),
      accessCode: await generateAccessCode(),
      groupId,
      order: (last?.order ?? -1) + 1,
    },
  });

  return NextResponse.json({ student });
}
