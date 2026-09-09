import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  const wantsTeacher = pathname.startsWith("/dashboard/teacher");
  const wantsStudent = pathname.startsWith("/dashboard/student");

  if (!role && (wantsTeacher || wantsStudent)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (wantsTeacher && role !== "teacher") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (wantsStudent && role !== "student") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
