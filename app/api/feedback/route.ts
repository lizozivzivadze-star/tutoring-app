import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendFeedbackEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const message =
    typeof body?.message === "string" ? body.message.trim() : "";
  const page = typeof body?.page === "string" ? body.page.slice(0, 200) : "";

  if (!message) {
    return NextResponse.json({ error: "ჩაწერეთ ტექსტი" }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json(
      { error: "ტექსტი ძალიან გრძელია (მაქს. 2000 სიმბოლო)" },
      { status: 400 }
    );
  }

  const session = await auth();

  const admins = await prisma.admin.findMany({
    select: { notificationEmail: true },
  });
  const to = admins.map((a) => a.notificationEmail);
  if (to.length === 0) {
    return NextResponse.json({ error: "ვერ გაიგზავნა" }, { status: 500 });
  }

  try {
    await sendFeedbackEmail({
      to,
      message,
      page,
      senderEmail: session?.user?.email ?? null,
      senderRole: session?.user?.role ?? null,
    });
  } catch {
    return NextResponse.json({ error: "ვერ გაიგზავნა" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
