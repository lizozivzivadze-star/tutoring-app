import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentStudentId } from "@/lib/current-student";
import { getSettings } from "@/lib/settings";

// ტესტის ხელახლა დაწყება: მიმდინარე შედეგი აღინიშნება როგორც ჩანაცვლებული
// (ბაზაში რჩება, მაგრამ აღარსად ჩანს) და ტესტი ისევ გასაკეთებელი ხდება.
export async function POST(req: NextRequest) {
  const studentId = await getCurrentStudentId();
  if (!studentId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const { sentTestId } = await req.json().catch(() => ({}));
  if (!sentTestId || typeof sentTestId !== "string") {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const current = await prisma.testAttempt.findFirst({
    where: { sentTestId, studentId, superseded: false },
    select: { id: true },
  });
  if (!current) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const settings = await getSettings();
  if (settings.retakeLimit != null) {
    const done = await prisma.testAttempt.count({
      where: { sentTestId, studentId, superseded: true },
    });
    if (done >= settings.retakeLimit) {
      return NextResponse.json(
        { error: "ამ ტესტის ხელახლა გაკეთების ლიმიტი ამოწურულია." },
        { status: 403 }
      );
    }
  }

  await prisma.testAttempt.updateMany({
    where: { sentTestId, studentId, superseded: false },
    data: { superseded: true },
  });

  return NextResponse.json({ ok: true });
}
