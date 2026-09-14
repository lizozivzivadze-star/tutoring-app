import { prisma } from "@/lib/prisma";
import type { Settings } from "@prisma/client";

export { fillTemplate } from "@/lib/template";

// One row, fixed id. Created lazily on first read/write so there's
// no separate seed step required for it — the Prisma-level
// @default() values on each column become the effective defaults
// the first time this runs.
const SETTINGS_ID = "singleton";

export async function getSettings(): Promise<Settings> {
  const existing = await prisma.settings.findUnique({
    where: { id: SETTINGS_ID },
  });
  if (existing) return existing;
  return prisma.settings.create({ data: { id: SETTINGS_ID } });
}

export async function updateSettings(
  data: Partial<Omit<Settings, "id" | "updatedAt">>
): Promise<Settings> {
  return prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...data },
    update: data,
  });
}

