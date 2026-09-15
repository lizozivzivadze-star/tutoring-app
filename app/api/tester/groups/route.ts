import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTesterId } from "@/lib/current-teacher";

export async function GET() {
  const testerId = await getCurrentTesterId();
  if (!testerId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const groups = await prisma.group.findMany({
    where: { testerId },
    orderBy: { order: "asc" },
    include: {
      students: { orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json({ groups });
}

export async function POST(req: NextRequest) {
  const testerId = await getCurrentTesterId();
  if (!testerId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "სახელი აუცილებელია" }, { status: 400 });
  }

  const last = await prisma.group.findFirst({
    where: { testerId },
    orderBy: { order: "desc" },
  });

  const group = await prisma.group.create({
    data: {
      name: name.trim(),
      testerId,
      order: (last?.order ?? -1) + 1,
    },
    include: { students: true },
  });

  return NextResponse.json({ group });
}