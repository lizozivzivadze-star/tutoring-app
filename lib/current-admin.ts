import { auth } from "@/lib/auth";

export async function getCurrentAdminId(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.role !== "admin") return null;
  return session.user.id;
}
