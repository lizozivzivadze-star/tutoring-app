import { NextResponse } from "next/server";
import { getCurrentTeacherId } from "@/lib/current-teacher";
import { getSettings } from "@/lib/settings";

// Read-only, teacher-facing slice of Settings: only the admin-edited
// display copy the teacher dashboard needs (default test instruction,
// delete-confirmation wording). Deliberately excludes teacherInviteCode
// and every notification/email text that has no business reaching a
// teacher's browser.
export async function GET() {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const settings = await getSettings();

  return NextResponse.json({
    defaultTestInstruction: settings.defaultTestInstruction ?? "",
    themeDeleteConfirmText: settings.themeDeleteConfirmText,
    groupDeleteConfirmText: settings.groupDeleteConfirmText,
    studentDeleteConfirmText: settings.studentDeleteConfirmText,
  });
}
