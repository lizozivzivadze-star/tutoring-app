import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendMagicLinkEmail } from "@/lib/mailer";
import { getSettings } from "@/lib/settings";

export async function POST(req: NextRequest) {
  const { email: rawEmail } = await req.json();
  const typedEmail = typeof rawEmail === "string" ? rawEmail.trim() : "";

  if (!typedEmail) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

    // One shared login form, one shared endpoint — role is never taken
  // from the client. We look up which table this email belongs to.
  // There is no path here (or anywhere in the public app) that
  // creates a Teacher record, so this can never be used to become
  // a teacher — only to log in as one that already exists. Admins
  // and testers are matched on identityEmail, same principle.
  const ci = { equals: typedEmail, mode: "insensitive" as const };
  const [teacher, student, admin, tester] = await Promise.all([
    prisma.teacher.findFirst({ where: { email: ci } }),
    prisma.student.findFirst({ where: { email: ci } }),
    prisma.admin.findFirst({ where: { identityEmail: ci } }),
    prisma.tester.findFirst({ where: { identityEmail: ci } }),
  ]);

  const role = teacher
    ? "teacher"
    : student
      ? "student"
      : admin
        ? "admin"
        : tester
          ? "tester"
          : null;

  const settings = await getSettings();

  if (!role) {
    // Deliberately vague: don't reveal whether the email exists,
    // just that no login link can be sent for it.
    return NextResponse.json(
      { error: settings.notFoundEmailText },
      { status: 404 }
    );
  }
  
    const email = (teacher?.email ??
    student?.email ??
    admin?.identityEmail ??
    tester?.identityEmail) as string;

  const token = randomBytes(24).toString("hex");
  const pollId = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 min

  await prisma.loginToken.create({
        data: { token, pollId, email, role, expiresAt },
  });

  const url = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`;

  // For every role the login form is filled in with the identity
  // email, but only admins and testers have a separate inbox the
  // mail should actually land in.
  const deliverTo = admin
    ? admin.notificationEmail
    : tester
      ? tester.notificationEmail
      : email;

  await sendMagicLinkEmail({
    to: deliverTo,
    role,
    url,
    subjectTemplate: settings.magicLinkSubject,
    bodyTemplate: settings.magicLinkBodyText,
  });

    return NextResponse.json({ ok: true, pollId });
}
