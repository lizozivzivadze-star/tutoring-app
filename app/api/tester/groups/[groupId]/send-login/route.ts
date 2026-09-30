import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendLoginInviteEmail } from "@/lib/mailer";
import { getCurrentTesterId } from "@/lib/current-teacher";

export const maxDuration = 30;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const testerId = await getCurrentTesterId();
  if (!testerId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { students: { select: { name: true, email: true } } },
  });
  if (!group || group.testerId !== testerId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (group.students.length === 0) {
    return NextResponse.json(
      { error: "ჯგუფში მოსწავლე არ არის" },
      { status: 400 }
    );
  }

  const url = process.env.NEXTAUTH_URL!;
  const results = await Promise.allSettled(
    group.students.map((s) =>
      sendLoginInviteEmail({ to: s.email, name: s.name, url })
    )
  );
  const sent = results.filter((r) => r.status === "fulfilled").length;

  return NextResponse.json({ sent, failed: results.length - sent });
}