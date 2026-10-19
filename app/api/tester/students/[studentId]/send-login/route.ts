import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTesterId } from "@/lib/current-teacher";
import { sendLoginInviteEmail } from "@/lib/mailer";

export const maxDuration = 30;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const testerId = await getCurrentTesterId();
  if (!testerId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { group: true },
  });
  if (!student || student.group?.testerId !== testerId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    await sendLoginInviteEmail({
      to: student.email,
      name: student.name,
      url: process.env.NEXTAUTH_URL!,
    });
  } catch {
    return NextResponse.json({ error: "ვერ გაიგზავნა" }, { status: 500 });
  }

  return NextResponse.json({ sent: 1 });
}