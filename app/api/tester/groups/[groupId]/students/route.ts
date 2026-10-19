import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTesterId } from "@/lib/current-teacher";
import { generateAccessCode } from "@/lib/access-code";
import { isStaffEmail } from "@/lib/staff-email";
import { sendLoginInviteEmail } from "@/lib/mailer";

export const maxDuration = 30;

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
  if (existing && existing.groupId !== null) {
    return NextResponse.json(
      { error: "ეს email უკვე რეგისტრირებულია" },
      { status: 409 }
    );
  }
  if (!existing && (await isStaffEmail(cleanEmail))) {
    return NextResponse.json(
      { error: "ეს email უკვე გამოიყენება სხვა ანგარიშზე" },
      { status: 409 }
    );
  }

  const last = await prisma.student.findFirst({
    where: { groupId },
    orderBy: { order: "desc" },
  });

  const nextOrder = (last?.order ?? -1) + 1;
  const student = existing
    ? await prisma.student.update({
        where: { id: existing.id },
        data: {
          name: name.trim(),
          surname: surname?.trim() || existing.surname,
          contact: contact?.trim() || existing.contact,
          groupId,
          order: nextOrder,
        },
      })
    : await prisma.student.create({
        data: {
          name: name.trim(),
          surname: surname?.trim() || null,
          contact: contact?.trim() || null,
          email: email.trim(),
          accessCode: await generateAccessCode(),
          groupId,
          order: nextOrder,
        },
      });

  let emailSent = true;
  try {
    await sendLoginInviteEmail({
      to: student.email,
      name: student.name,
      url: process.env.NEXTAUTH_URL!,
    });
  } catch {
    emailSent = false;
  }

  return NextResponse.json({ student, emailSent });
}