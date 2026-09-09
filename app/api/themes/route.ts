import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/current-teacher";

export async function GET() {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const themes = await prisma.theme.findMany({
    where: { teacherId },
    orderBy: { order: "asc" },
    include: {
      tests: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          type: true,
          order: true,
          title: true,
          published: true,
        },
      },
    },
  });

  return NextResponse.json({ themes });
}

export async function POST(req: NextRequest) {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "სახელი აუცილებელია" }, { status: 400 });
  }

  const last = await prisma.theme.findFirst({
    where: { teacherId },
    orderBy: { order: "desc" },
  });

  const theme = await prisma.theme.create({
    data: {
      name: name.trim(),
      teacherId,
      order: (last?.order ?? -1) + 1,
    },
    include: { tests: true },
  });

  return NextResponse.json({ theme });
}
