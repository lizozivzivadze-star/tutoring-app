import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Profile = {
  name: string;
  surname: string;
  phone: string;
  email: string;
};

async function loadProfile(role: string, id: string): Promise<Profile | null> {
  if (role === "teacher") {
    const t = await prisma.teacher.findUnique({ where: { id } });
    if (!t) return null;
    return { name: t.name ?? "", surname: t.surname ?? "", phone: t.phone ?? "", email: t.email };
  }
  if (role === "student") {
    const s = await prisma.student.findUnique({ where: { id } });
    if (!s) return null;
    return { name: s.name ?? "", surname: s.surname ?? "", phone: s.contact ?? "", email: s.email };
  }
  if (role === "admin") {
    const a = await prisma.admin.findUnique({ where: { id } });
    if (!a) return null;
    return { name: a.name ?? "", surname: a.surname ?? "", phone: a.phone ?? "", email: a.identityEmail };
  }
  if (role === "tester") {
    const t = await prisma.tester.findUnique({ where: { id } });
    if (!t) return null;
    return { name: t.name ?? "", surname: t.surname ?? "", phone: t.phone ?? "", email: t.identityEmail };
  }
  return null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const profile = await loadProfile(session.user.role, session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ profile });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const surname = typeof body.surname === "string" ? body.surname.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  const { role, id } = session.user;

  if (role === "teacher") {
    await prisma.teacher.update({ where: { id }, data: { name, surname, phone } });
  } else if (role === "student") {
    await prisma.student.update({ where: { id }, data: { name, surname, contact: phone } });
  } else if (role === "admin") {
    await prisma.admin.update({ where: { id }, data: { name, surname, phone } });
  } else if (role === "tester") {
    await prisma.tester.update({ where: { id }, data: { name, surname, phone } });
  } else {
    return NextResponse.json({ error: "unknown role" }, { status: 400 });
  }

  const profile = await loadProfile(role, id);
  return NextResponse.json({ profile });
}