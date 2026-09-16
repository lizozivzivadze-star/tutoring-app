import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function RootPage() {
  const session = await auth();

  if (session?.user?.role === "teacher") {
    redirect("/dashboard/teacher");
  }
  if (session?.user?.role === "student") {
    redirect("/dashboard/student");
  }
  if (session?.user?.role === "admin") {
    redirect("/dashboard/admin");
  }
  if (session?.user?.role === "tester") {
    redirect("/dashboard/tester");
  }

  redirect("/login");
}