import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/current-teacher";

async function loadOwned(testId: string, teacherId: string) {
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      theme: true,
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
      _count: { select: { sentTests: true } },
    },
  });
  return test && test.theme.teacherId === teacherId ? test : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const test = await loadOwned(testId, teacherId);
  if (!test) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    test: { ...test, locked: test._count.sentTests > 0 },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const existing = await loadOwned(testId, teacherId);
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { themeId, title, instruction, published, questions, republish } =
    await req.json();

  const locked = existing._count.sentTests > 0;
  if (questions && locked) {
    // Once a test has been sent to any group, its questions are
    // frozen: changing them after students may have already taken it
    // (or are about to) would silently rewrite what their score and
    // review are being compared against. Title/instruction/publish
    // state can still change — only the question set is locked.
    return NextResponse.json(
      {
        error:
          "ეს ტესტი უკვე გაგზავნილია — კითხვების შეცვლა აღარ შეიძლება. თუ ცვლილება გჭირდება, შექმენით ახალი ტესტი.",
      },
      { status: 409 }
    );
  }

  if (themeId && themeId !== existing.themeId) {
    const newTheme = await prisma.theme.findUnique({ where: { id: themeId } });
    if (!newTheme || newTheme.teacherId !== teacherId) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
  }

  if (!title?.trim()) {
    return NextResponse.json({ error: "სათაური აუცილებელია" }, { status: 400 });
  }

  if (questions) {
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
  }

  const test = await prisma.$transaction(async (tx) => {
    if (questions) {
      // Full replace — safe here only because we've already refused
      // this branch when the test is locked (has been sent), so no
      // AttemptAnswer rows referencing these questions can exist yet.
      await tx.question.deleteMany({ where: { testId } });
    }

    const finalTitle = title.trim();
    const finalInstruction = instruction?.trim() || null;
    const now = new Date();

    // Built from the incoming payload (or, if questions weren't part
    // of this save, from the existing rows) — not from a post-update
    // read — so the snapshot can be written in the SAME update call
    // as publishedAt/updatedAt. Doing it in a second .update() call
    // was the bug: Prisma bumps @updatedAt on every .update(), so a
    // second call always left updatedAt newer than publishedAt, even
    // seconds after a fresh publish.
    const snapshot = republish
      ? {
          title: finalTitle,
          instruction: finalInstruction,
          questions: (
            questions ??
            existing.questions.map((q) => ({
              prompt: q.prompt,
              options: q.options.map((o) => ({
                text: o.text,
                isCorrect: o.isCorrect,
              })),
            }))
          ).map(
            (q: {
              prompt: string;
              options: { text: string; isCorrect: boolean }[];
            }) => ({
              prompt: q.prompt.trim ? q.prompt.trim() : q.prompt,
              options: q.options.map((o) => ({
                text: o.text.trim ? o.text.trim() : o.text,
                isCorrect: Boolean(o.isCorrect),
              })),
            })
          ),
        }
      : undefined;

    const updated = await tx.test.update({
      where: { id: testId },
      data: {
        themeId: themeId ?? existing.themeId,
        title: finalTitle,
        instruction: finalInstruction,
        published: published ?? existing.published,
        ...(republish && {
          publishedAt: now,
          updatedAt: now,
          publishedSnapshot: snapshot,
        }),
        ...(questions && {
          questions: {
            create: questions.map(
              (
                q: {
                  prompt: string;
                  options: { text: string; isCorrect: boolean }[];
                },
                qIndex: number
              ) => ({
                prompt: q.prompt.trim(),
                order: qIndex,
                options: {
                  create: q.options.map(
                    (o: { text: string; isCorrect: boolean }, oIndex: number) => ({
                      text: o.text.trim(),
                      isCorrect: Boolean(o.isCorrect),
                      order: oIndex,
                    })
                  ),
                },
              })
            ),
          },
        }),
      },
      include: { questions: { include: { options: true } } },
    });

    return updated;
  });

  return NextResponse.json({ test });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const existing = await loadOwned(testId, teacherId);
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (existing._count.sentTests > 0) {
    // Same rule as editing questions: once sent, a test (and any
    // attempts/results riding on it) is kept for the record instead
    // of being deletable.
    return NextResponse.json(
      {
        error:
          "ეს ტესტი უკვე გაგზავნილია — წაშლა აღარ შეიძლება, რომ მოსწავლეების შედეგები არ დაიკარგოს.",
      },
      { status: 409 }
    );
  }

  await prisma.test.delete({ where: { id: testId } });

  return NextResponse.json({ ok: true });
}
