import TeacherTabs from "./teacher-tabs";
import UserMenu from "@/components/user-menu";
import Greeting from "@/components/greeting";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/current-teacher";

export default async function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const id = await getCurrentTeacherId();
  const teacher = id
    ? await prisma.teacher.findUnique({ where: { id }, select: { name: true } })
    : null;

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-20 bg-white">
        <header className="ruled-edge bg-white px-6 py-6 flex items-center justify-between gap-4">
          <Greeting name={teacher?.name} />
          <UserMenu />
        </header>

        <TeacherTabs />
      </div>

      <main className="px-6 py-8 max-w-sm mx-auto">
        <div className="p-5">
          {children}
        </div>
      </main>
    </div>
  );
}