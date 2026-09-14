import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getCurrentAdminId } from "@/lib/current-admin";
import { updateSettings } from "@/lib/settings";

// Generates a fresh, long random invite code and stores it as the
// active code straight away — any code handed out before this call
// stops working the moment it runs. Admin edits the code by hand via
// PATCH /api/admin/settings (teacherInviteCode) if they'd rather set
// a memorable one themselves; this endpoint is only the "generate a
// new random one" button.
export async function POST() {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const teacherInviteCode = randomBytes(9).toString("base64url");
  const settings = await updateSettings({ teacherInviteCode });

  return NextResponse.json({ settings });
}
