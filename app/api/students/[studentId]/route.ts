import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/current-teacher";

async function assertOwnership(studentId: string, teacherId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { group: true },
  });
  return student && student.group?.teacherId === teacherId ? student : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const owned = await assertOwnership(studentId, teacherId);
  if (!owned) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    student: {
      name: owned.name,
      surname: owned.surname,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const owned = await assertOwnership(studentId, teacherId);
  if (!owned) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { name, surname, contact, email } = await req.json();
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json(
      { error: "სახელი და email აუცილებელია" },
      { status: 400 }
    );
  }

  if (email !== owned.email) {
    const clash = await prisma.student.findUnique({ where: { email } });
    if (clash) {
      return NextResponse.json(
        { error: "ეს email უკვე გამოყენებულია" },
        { status: 409 }
      );
    }
  }

  const student = await prisma.student.update({
    where: { id: studentId },
    data: {
      name: name.trim(),
      surname: surname?.trim() || null,
      contact: contact?.trim() || null,
      email: email.trim(),
    },
  });

  return NextResponse.json({ student });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const owned = await assertOwnership(studentId, teacherId);
  if (!owned) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await prisma.student.delete({ where: { id: studentId } });

  return NextResponse.json({ ok: true });
}
