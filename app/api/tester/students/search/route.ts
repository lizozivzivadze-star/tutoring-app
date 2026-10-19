import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTesterId } from "@/lib/current-teacher";

export async function GET(req: NextRequest) {
  const testerId = await getCurrentTesterId();
  if (!testerId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ students: [] });
  }

  const students = await prisma.student.findMany({
    where: {
      groupId: null,
      email: { startsWith: q, mode: "insensitive" },
    },
    select: { id: true, email: true, name: true, surname: true },
    orderBy: { email: "asc" },
    take: 5,
  });

  return NextResponse.json({ students });
}