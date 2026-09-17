import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTesterId } from "@/lib/current-teacher";

const VALID_TYPES = ["type1", "type2", "type3"] as const;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ themeId: string }> }
) {
  const { themeId } = await params;
  const testerId = await getCurrentTesterId();
  if (!testerId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const theme = await prisma.theme.findUnique({ where: { id: themeId } });
  if (!theme || theme.testerId !== testerId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { type, title, instruction, questions, published } = await req.json();

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }
  if (type !== "type1") {
    // Only the MCQ template (type1) exists so far — type2/type3 are
    // reserved slots in the UI for templates not designed yet.
    return NextResponse.json(
      { error: "ეს შაბლონი ჯერ არ არის მზად" },
      { status: 400 }
    );
  }
  if (!title?.trim()) {
    return NextResponse.json({ error: "სათაური აუცილებელია" }, { status: 400 });
  }
  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json(
      { error: "მინიმუმ ერთი კითხვაა საჭირო" },
      { status: 400 }
    );
  }
  for (const q of questions) {
    if (!q.prompt?.trim()) {
      return NextResponse.json({ error: "ყველა კითხვას სჭირდება ტექსტი" }, { status: 400 });
    }
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 4) {
      return NextResponse.json(
        { error: "თითო კითხვას სჭირდება 2-დან 4-მდე პასუხი" },
        { status: 400 }
      );
    }
    if (!q.options.some((o: { isCorrect?: boolean }) => o.isCorrect)) {
      return NextResponse.json(
        { error: "ყველა კითხვას სჭირდება მონიშნული სწორი პასუხი" },
        { status: 400 }
      );
    }
  }

  const last = await prisma.test.findFirst({
    where: { themeId, type },
    orderBy: { order: "desc" },
  });

  // Same instant used for both timestamps below — otherwise
  // updatedAt (set by Prisma's @updatedAt at actual insert time)
  // always lands a beat after publishedAt, making a just-published
  // test look like it has unpublished edits.
  const now = new Date();

  const snapshot = published
    ? {
        title: title.trim(),
        instruction: instruction?.trim() || null,
        questions: questions.map(
          (q: { prompt: string; options: { text: string; isCorrect: boolean }[] }) => ({
            prompt: q.prompt.trim(),
            options: q.options.map((o) => ({
              text: o.text.trim(),
              isCorrect: Boolean(o.isCorrect),
            })),
          })
        ),
      }
    : null;

  const test = await prisma.test.create({
    data: {
      themeId,
      type,
      title: title.trim(),
      instruction: instruction?.trim() || null,
      published: Boolean(published),
      publishedAt: published ? now : null,
      updatedAt: now,
      publishedSnapshot: snapshot ?? undefined,
      order: (last?.order ?? -1) + 1,
      questions: {
        create: questions.map(
          (
            q: { prompt: string; options: { text: string; isCorrect: boolean }[] },
            qIndex: number
          ) => ({
            prompt: q.prompt.trim(),
            order: qIndex,
            options: {
              create: q.options.map((o, oIndex: number) => ({
                text: o.text.trim(),
                isCorrect: Boolean(o.isCorrect),
                order: oIndex,
              })),
            },
          })
        ),
      },
    },
    include: { questions: { include: { options: true } } },
  });

  return NextResponse.json({ test });
}
