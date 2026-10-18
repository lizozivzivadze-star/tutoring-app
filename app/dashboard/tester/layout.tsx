import TesterTabs from "./tester-tabs";
import UserMenu from "@/components/user-menu";
import HideOnScroll from "@/components/hide-on-scroll";
import LogoLink from "@/components/logo-link";
import { prisma } from "@/lib/prisma";
import { getCurrentTesterId } from "@/lib/current-teacher";
import DashboardMain from "./dashboard-main";

export default async function TesterDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const id = await getCurrentTesterId();
  const tester = id
    ? await prisma.tester.findUnique({ where: { id }, select: { name: true } })
    : null;

  return (
    <div className="min-h-screen">
      <HideOnScroll>
        <header data-app-menu className="ruled-edge bg-white px-6 py-6 flex items-center justify-between gap-4">
          <LogoLink />
          <UserMenu showCancelPending cancelEndpoint="/api/tester/cancel-pending-tests" />
        </header>

        <TesterTabs />
      </HideOnScroll>

<DashboardMain>{children}</DashboardMain>
    </div>
  );
}