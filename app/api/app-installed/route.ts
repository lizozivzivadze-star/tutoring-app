import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: ამ მომხმარებელმა უკვე გახსნა თუ არა საიტი დაინსტალირებული აპიდან.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }
  const row = await prisma.appInstall.findUnique({
    where: { role_userId: { role: session.user.role, userId: session.user.id } },
    select: { id: true },
  });
  return NextResponse.json({ installed: !!row });
}

// POST: იძახება მხოლოდ მაშინ, როცა საიტი აპის რეჟიმშია (ხატულიდან გახსნილი).
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }
  const key = { role: session.user.role, userId: session.user.id };
  await prisma.appInstall.upsert({
    where: { role_userId: key },
    create: key,
    update: {},
  });
  return NextResponse.json({ installed: true });
}
