import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encode } from "next-auth/jwt";

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

  // ტოკენის გამოყენებულად მონიშვნა
  await prisma.loginToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  const destination =
    record.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student";

  // მომხმარებლის მოძებნა ბაზაში
const user =
  record.role === "teacher"
    ? await prisma.teacher.findUnique({ where: { email: record.email } })
    : await prisma.student.findUnique({ where: { email: record.email } });

  if (!user) {
    return NextResponse.redirect(loginUrl);
  }

  // JWT სესიის ტოკენის ხელით დაგენერირება
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
  const sessionToken = await encode({
  token: {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: record.role,
  },
    secret,
    salt: process.env.NODE_ENV === "production" 
      ? "__Secure-authjs.session-token" 
      : "authjs.session-token",
  });

  const response = NextResponse.redirect(new URL(destination, req.url));

  // სესიის კუკის პირდაპირ ბრაუზერში ჩაწერა
  const cookieName = process.env.NODE_ENV === "production" 
    ? "__Secure-authjs.session-token" 
    : "authjs.session-token";

  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}