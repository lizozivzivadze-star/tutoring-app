import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendMagicLinkEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  // One shared login form, one shared endpoint — role is never taken
  // from the client. We look up which table this email belongs to.
  // There is no path here (or anywhere in the public app) that
  // creates a Teacher record, so this can never be used to become
  // a teacher — only to log in as one that already exists.
  const [teacher, student] = await Promise.all([
    prisma.teacher.findUnique({ where: { email } }),
    prisma.student.findUnique({ where: { email } }),
  ]);

  const role = teacher ? "teacher" : student ? "student" : null;

  if (!role) {
    // Deliberately vague: don't reveal whether the email exists,
    // just that no login link can be sent for it.
    return NextResponse.json(
      { error: "ეს ელფოსტა სისტემაში ვერ მოიძებნა" },
      { status: 404 }
    );
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 min

  await prisma.loginToken.create({
    data: { token, email, role, expiresAt },
  });

  const url = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`;

  await sendMagicLinkEmail({ to: email, role, url });

  return NextResponse.json({ ok: true });
}
