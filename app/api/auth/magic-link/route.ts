import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendMagicLinkEmail } from "@/lib/mailer";
import { getSettings } from "@/lib/settings";
import { isRuEmail, RU_BLOCK_MESSAGE } from "@/lib/email-domain";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const { email: rawEmail, role: registerRole } = await req.json();
  const typedEmail = typeof rawEmail === "string" ? rawEmail.trim() : "";

  if (!typedEmail) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

    // One shared login form, one shared endpoint — role is never taken
  // from the client. We look up which table this email belongs to.
  // While open registration is off (default), nothing here creates a
  // Teacher record, so this can only log in an existing teacher. When
  // the admin turns it on, see the registration branch below. Admins
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
    // ღია რეგისტრაცია ჩართულია: უცნობი მეილი ახალ ანგარიშს რეგისტრირებს.
    // ანგარიში აქ არ იქმნება — მხოლოდ მეილის ბმულზე დაჭერისას
    // (/api/auth/verify), ანუ მეილის დადასტურების შემდეგ.
    if (settings.openRegistration) {
      if (!EMAIL_RE.test(typedEmail)) {
        return NextResponse.json(
          { error: "შეიყვანეთ სწორი Email" },
          { status: 400 }
        );
      }
      if (isRuEmail(typedEmail)) {
        return NextResponse.json({ error: RU_BLOCK_MESSAGE }, { status: 400 });
      }
      // ჯერ სტატუსი არ აურჩევია → login გვერდი აჩვენებს არჩევის ფანჯარას
      if (registerRole !== "teacher" && registerRole !== "student") {
        return NextResponse.json({ needsRole: true });
      }

      const regEmail = typedEmail.toLowerCase();
      const token = randomBytes(24).toString("hex");
      const pollId = randomBytes(24).toString("hex");
      const pollSecret = randomBytes(24).toString("hex");
      const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 min

      await prisma.loginToken.create({
        data: {
          token,
          pollId,
          pollSecret,
          email: regEmail,
          role: registerRole,
          expiresAt,
          register: true,
        },
      });

      const baseUrl = (process.env.NEXTAUTH_URL ?? "").replace(/\/+$/, "");
      await sendMagicLinkEmail({
        to: regEmail,
        name: null,
        role: registerRole,
        url: `${baseUrl}/api/auth/verify?token=${token}`,
        subjectTemplate: settings.magicLinkSubject,
        bodyTemplate: settings.magicLinkBodyText,
      });

      return NextResponse.json({ ok: true, pollId, pollSecret });
    }

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
  const pollSecret = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 min

  await prisma.loginToken.create({
        data: { token, pollId, pollSecret, email, role, expiresAt },
  });

  const baseUrl = (process.env.NEXTAUTH_URL ?? "").replace(/\/+$/, "");
  const url = `${baseUrl}/api/auth/verify?token=${token}`;

  // For every role the login form is filled in with the identity
  // email. Admins and testers always have a separate inbox the mail
  // lands in; a teacher has one only if notificationEmail is set.
  const deliverTo = teacher
    ? teacher.notificationEmail || email
    : admin
      ? admin.notificationEmail
      : tester
        ? tester.notificationEmail
        : email;

  // Greeting name: same source as the record the email matched on.
  const recipientName =
    teacher?.name ?? student?.name ?? admin?.name ?? tester?.name ?? null;

  await sendMagicLinkEmail({
    to: deliverTo,
    name: recipientName,
    role,
    url,
    subjectTemplate: settings.magicLinkSubject,
    bodyTemplate: settings.magicLinkBodyText,
  });

    return NextResponse.json({ ok: true, pollId, pollSecret });
}
