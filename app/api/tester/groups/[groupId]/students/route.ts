import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTesterId } from "@/lib/current-teacher";
import { generateAccessCode } from "@/lib/access-code";
import { isStaffEmail } from "@/lib/staff-email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const testerId = await getCurrentTesterId();
  if (!testerId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.testerId !== testerId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { name, surname, contact, email } = await req.json();
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json(
      { error: "სახელი და email აუცილებელია" },
      { status: 400 }
    );
  }
  if (name.trim().length > 30 || (surname && surname.trim().length > 30)) {
    return NextResponse.json(
      { error: "სახელი და გვარი არ უნდა აღემატებოდეს 30 სიმბოლოს" },
      { status: 400 }
    );
  }

  const cleanEmail = email.trim();

  const existing = await prisma.student.findFirst({
    where: { email: { equals: cleanEmail, mode: "insensitive" } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "ეს email უკვე რეგისტრირებულია" },
      { status: 409 }
    );
  }
  if (await isStaffEmail(cleanEmail)) {
    return NextResponse.json(
      { error: "ეს email უკვე გამოიყენება სხვა ანგარიშზე" },
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