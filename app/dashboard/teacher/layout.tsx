import TeacherTabs from "./teacher-tabs";
import UserMenu from "@/components/user-menu";
import HideOnScroll from "@/components/hide-on-scroll";
import Greeting from "@/components/greeting";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/current-teacher";
import DashboardMain from "./dashboard-main";

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
      <HideOnScroll>
        <header data-app-menu className="ruled-edge bg-white px-6 py-6 flex items-center justify-between gap-4">
          <Greeting name={teacher?.name} />
          <UserMenu showCancelPending />
        </header>

        <TeacherTabs />
      </HideOnScroll>

<DashboardMain>{children}</DashboardMain>
    </div>
  );
}