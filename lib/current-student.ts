import { auth } from "@/lib/auth";

// Real session lookup — replaces the earlier stand-in that returned
// the first Student row. Every route that calls this now only gets
// an id for a student who is actually logged in as a student.
export async function getCurrentStudentId(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.role !== "student") return null;
  return session.user.id;
}
