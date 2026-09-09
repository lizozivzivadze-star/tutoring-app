import { auth } from "@/lib/auth";

// Real session lookup — replaces the earlier stand-in that returned
// the first Teacher row. Every route that calls this now only gets
// an id for a teacher who is actually logged in as a teacher.
export async function getCurrentTeacherId(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.role !== "teacher") return null;
  return session.user.id;
}
