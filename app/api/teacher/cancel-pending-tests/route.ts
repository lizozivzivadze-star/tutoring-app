import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/current-teacher";

export async function POST() {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const { count } = await prisma.sentTest.deleteMany({
    where: {
      attempts: { none: {} },
      OR: [
        { group: { teacherId } },
        { student: { group: { teacherId } } },
      ],
    },
  });

  return NextResponse.json({ cancelled: count });
}