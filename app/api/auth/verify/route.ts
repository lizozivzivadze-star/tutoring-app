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
      redirectTo: destination, // NextAuth-ს პირდაპირ ვავალებთ სწორ მისამართზე გადაყვანას
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.redirect(loginUrl);
    }
    // Next.js-ის ავტომატური redirect() აგდებს შეცდომას, რომელსაც ვატარებთ,
    // რათა სესიის კუკი უსაფრთხოდ გაყვეს გადამისამართებას.
    throw err;
  }
}