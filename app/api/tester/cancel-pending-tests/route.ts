import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTesterId } from "@/lib/current-teacher";

export async function POST() {
  const testerId = await getCurrentTesterId();
  if (!testerId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const { count } = await prisma.sentTest.deleteMany({
    where: {
      attempts: { none: {} },
      OR: [
        { group: { testerId } },
        { student: { group: { testerId } } },
      ],
    },
  });

  return NextResponse.json({ cancelled: count });
}