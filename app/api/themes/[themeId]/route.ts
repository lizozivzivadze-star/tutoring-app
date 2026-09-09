import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/current-teacher";

async function assertOwnership(themeId: string, teacherId: string) {
  const theme = await prisma.theme.findUnique({ where: { id: themeId } });
  return theme && theme.teacherId === teacherId ? theme : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ themeId: string }> }
) {
  const { themeId } = await params;
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const owned = await assertOwnership(themeId, teacherId);
  if (!owned) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "სახელი აუცილებელია" }, { status: 400 });
  }

  const theme = await prisma.theme.update({
    where: { id: themeId },
    data: { name: name.trim() },
  });

  return NextResponse.json({ theme });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ themeId: string }> }
) {
  const { themeId } = await params;
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const owned = await assertOwnership(themeId, teacherId);
  if (!owned) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const sentCount = await prisma.sentTest.count({
    where: { test: { themeId } },
  });
  if (sentCount > 0) {
    // Same rule as deleting an individual test: once any test under
    // this theme has been sent, the theme can't cascade-delete it
    // out from under students' results.
    return NextResponse.json(
      {
        error:
          "ამ თემაში არის უკვე გაგზავნილი ტესტი — თემის წაშლა შეუძლებელია, სანამ ის ტესტი არსებობს.",
      },
      { status: 409 }
    );
  }

  // Deleting a theme cascades to its (never-sent) tests/questions/
  // options (schema: onDelete Cascade) — safe now that we've ruled
  // out any sent tests above.
  await prisma.theme.delete({ where: { id: themeId } });

  return NextResponse.json({ ok: true });
}
