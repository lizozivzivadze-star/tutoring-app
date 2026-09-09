import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

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
    // Error case (Image 6): send back to the login/dashboard entry
    // point rather than leaving the user on a dead link.
    return NextResponse.redirect(loginUrl);
  }

  await prisma.loginToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  try {
    // This is the only caller of the "internal" credentials provider
    // in the whole app — it runs server-side, right after the
    // one-time token above has already been validated and burned,
    // and it's the only place that reads INTERNAL_AUTH_SECRET.
    await signIn("internal", {
      email: record.email,
      role: record.role,
      internalSecret: process.env.INTERNAL_AUTH_SECRET,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.redirect(loginUrl);
    }
    throw err;
  }

  const destination =
    record.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student";

  return NextResponse.redirect(new URL(destination, req.url));
}
