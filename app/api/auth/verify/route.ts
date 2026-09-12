import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError } from "next-auth";
import { signIn, auth } from "@/lib/auth";

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
    const dest =
      session.user.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student";
    return NextResponse.redirect(new URL(dest, req.url));
  }
  return NextResponse.redirect(loginUrl);
}

  await prisma.loginToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  const destination =
    record.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student";

  try {
    await signIn("internal", {
      email: record.email,
      role: record.role,
      internalSecret: process.env.INTERNAL_AUTH_SECRET,
      redirectTo: destination,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.redirect(loginUrl);
    }
    throw err;
  }
}