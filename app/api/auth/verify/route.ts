import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const DASHBOARD_BY_ROLE: Record<"teacher" | "student" | "admin" | "tester", string> = {
  teacher: "/dashboard/teacher",
  student: "/dashboard/student",
  admin: "/dashboard/admin",
  tester: "/dashboard/tester",
};

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const loginUrl = new URL("/login", req.url);

  if (!token) {
    return NextResponse.redirect(loginUrl);
  }

  const record = await prisma.loginToken.findUnique({ where: { token } });

  const isInvalid =
    !record || record.usedAt || record.expiresAt < new Date();

  if (isInvalid) {
    const session = await auth();
    if (session?.user?.role) {
      const dest = DASHBOARD_BY_ROLE[session.user.role];
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.redirect(loginUrl);
  }

  // GET-ზე ტოკენს აღარ ვხმარებთ — სასწავლო/კორპორატიული მეილების
  // Safe Links სკანერები ავტომატურად ხსნიან ბმულს ჯერ კიდევ ნამდვილ
  // დაწკაპუნებამდე, რაც ერთჯერად ტოკენს ადრეულად წვავს. ამის ნაცვლად
  // ნამდვილ ბრაუზერს ვაგზავნით გვერდზე, სადაც რეალურ დაწკაპუნებას
  // ველოდებით (იხ. POST ქვემოთ).
  return NextResponse.redirect(
    new URL(`/login/continue?token=${token}`, req.url)
  );
}

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // ტოკენს მხოლოდ "ვადას გავლილი/გამოყენებულის" მონიშვნა ეხება.
  // სესიას აქ აღარ ვქმნით — მას ის ფანჯარა მიიღებს, რომელმაც
  // ბმული მოითხოვა (იხ. claim route, შემდეგი ნაბიჯი).
  const updated = await prisma.loginToken.updateMany({
    where: { token, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });

  if (updated.count === 0) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}