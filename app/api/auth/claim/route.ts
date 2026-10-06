import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DASHBOARD_BY_ROLE: Record<"teacher" | "student" | "admin" | "tester", string> = {
  teacher: "/dashboard/teacher",
  student: "/dashboard/student",
  admin: "/dashboard/admin",
  tester: "/dashboard/tester",
};

// ბმულის დადასტურებიდან რამდენ ხანში შეიძლება სესიის აღება
const CLAIM_WINDOW_MS = 10 * 60 * 1000;

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

// სესიას აძლევს ექსკლუზიურად იმ ფანჯარას, რომელმაც ბმული მოითხოვა:
// მხოლოდ მას აქვს pollSecret (მეილში არ იგზავნება). ბმული უნდა იყოს
// დადასტურებული (usedAt) და ჯერ არ უნდა იყოს აღებული (claimedAt).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const pollId = typeof body?.pollId === "string" ? body.pollId : "";
  const pollSecret = typeof body?.pollSecret === "string" ? body.pollSecret : "";

  if (!pollId || !pollSecret) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const record = await prisma.loginToken.findUnique({ where: { pollId } });

  if (
    !record ||
    !record.pollSecret ||
    !safeEqual(record.pollSecret, pollSecret) ||
    !record.usedAt ||
    record.claimedAt ||
    Date.now() - record.usedAt.getTime() > CLAIM_WINDOW_MS
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // ატომური "აღება": ორი ერთდროული მოთხოვნიდან მხოლოდ ერთი გაივლის
  const claimed = await prisma.loginToken.updateMany({
    where: { id: record.id, claimedAt: null },
    data: { claimedAt: new Date() },
  });

  if (claimed.count === 0) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await signIn("internal", {
      email: record.email,
      role: record.role,
      internalSecret: process.env.INTERNAL_AUTH_SECRET,
      redirect: false,
    });
  } catch (err) {
    // შესვლა ვერ მოხერხდა — ტოკენი ისევ გავათავისუფლოთ, რომ ხელახლა სცადოს
    await prisma.loginToken.update({
      where: { id: record.id },
      data: { claimedAt: null },
    });
    if (err instanceof AuthError) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true, destination: DASHBOARD_BY_ROLE[record.role] });
}