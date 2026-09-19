import { NextRequest, NextResponse } from "next/server";
import type { Settings } from "@prisma/client";
import { getCurrentAdminId } from "@/lib/current-admin";
import { getSettings, updateSettings } from "@/lib/settings";

const EDITABLE_FIELDS = [
  "defaultTestInstruction",
  "notFoundEmailText",
  "magicLinkSubject",
  "magicLinkBodyText",
  "checkEmailText",
  "themeDeleteConfirmText",
  "groupDeleteConfirmText",
  "studentDeleteConfirmText",
  "siteTitle",
  "siteDescription",
] as const;

type EditableField = (typeof EDITABLE_FIELDS)[number];

export async function GET() {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const adminId = await getCurrentAdminId();
  if (!adminId) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const body = await req.json();

  // Only ever accept known, admin-owned columns — never id/updatedAt,
  // and never anything the client happens to send that isn't in this
  // list, since this route is a generic "patch the settings row".
  const data: Partial<Omit<Settings, "id" | "updatedAt">> = {};
  for (const key of EDITABLE_FIELDS) {
    if (!(key in body)) continue;
    const value = typeof body[key] === "string" ? body[key] : "";
    // defaultTestInstruction is the only nullable column — an empty
    // submission there means "no default", stored as null. Every
    // other column is NOT NULL, so an empty submission there just
    // stores "".
    if (key === "defaultTestInstruction") {
      data.defaultTestInstruction = value === "" ? null : value;
    } else {
      (data as Record<Exclude<EditableField, "defaultTestInstruction">, string>)[key] = value;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no valid fields" }, { status: 400 });
  }

  const settings = await updateSettings(data);
  return NextResponse.json({ settings });
}
