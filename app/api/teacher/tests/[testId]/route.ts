import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/current-teacher";

// მასწავლებლისთვის ტესტის ნახვა (მხოლოდ კითხვა). ჩანს მხოლოდ იმ ტესტერის
// გამოქვეყნებული ტესტი, რომელზეც მასწავლებელს წვდომა აქვს, და მხოლოდ
// ბოლო გამოქვეყნებული ვერსია (publishedSnapshot) — დრაფტი არასოდეს.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const test = await prisma.test.findFirst({
    where: {
      id: testId,
      published: true,
      activated: true, // ჩაკეტილი (გაუაქტიურებელი) ტესტის შინაარსი არ ჩანს
      theme: { tester: { teacherAccess: { some: { teacherId } } } },
    },
    select: {
      id: true,
      type: true,
      activated: true,
      publishedSnapshot: true,
    },
  });

  if (!test || !test.publishedSnapshot) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ test });
}
