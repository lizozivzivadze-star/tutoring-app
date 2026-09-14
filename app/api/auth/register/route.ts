import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendMagicLinkEmail } from "@/lib/mailer";
import { getSettings } from "@/lib/settings";

export async function POST(req: NextRequest) {
  const { name, email, code, phone } = await req.json();

  if (!name || !email || !code) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const settings = await getSettings();

  // The only gate on creating a Teacher record: a code admin sets
  // from the admin dashboard and shares out-of-band with legitimate
  // teachers. It never appears in the app's UI or client code, so a
  // student browsing the site has no way to discover or guess it
  // from within the product.
  if (!settings.teacherInviteCode || code !== settings.teacherInviteCode) {
    return NextResponse.json(
      { error: "რეგისტრაციის კოდი არასწორია" },
      { status: 403 }
    );
  }

  const [existingTeacher, existingStudent, existingAdmin] = await Promise.all([
    prisma.teacher.findUnique({ where: { email } }),
    prisma.student.findUnique({ where: { email } }),
    prisma.admin.findUnique({ where: { identityEmail: email } }),
  ]);

  if (existingTeacher || existingStudent || existingAdmin) {
    return NextResponse.json(
      { error: "ეს ელფოსტა უკვე რეგისტრირებულია" },
      { status: 409 }
    );
  }

  await prisma.teacher.create({ data: { email, name, phone } });

  // Registration hands straight off into the same magic-link flow
  // used for ordinary login — no separate password to set.
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 15);

  await prisma.loginToken.create({
    data: { token, email, role: "teacher", expiresAt },
  });

  const url = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`;

  await sendMagicLinkEmail({
    to: email,
    role: "teacher",
    url,
    subjectTemplate: settings.magicLinkSubject,
    bodyTemplate: settings.magicLinkBodyText,
  });

  return NextResponse.json({ ok: true });
}
