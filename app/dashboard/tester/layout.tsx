import TesterTabs from "./tester-tabs";
import UserMenu from "@/components/user-menu";
import Greeting from "@/components/greeting";
import { prisma } from "@/lib/prisma";
import { getCurrentTesterId } from "@/lib/current-teacher";

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
      <div className="sticky top-0 z-20 bg-white">
        <header data-app-menu className="ruled-edge bg-white px-6 py-6 flex items-center justify-between gap-4">
          <Greeting name={tester?.name} />
          <UserMenu showCancelPending />
        </header>

        <TesterTabs />
      </div>

      <main className="px-6 py-8 max-w-sm mx-auto">
        <div className="p-5">
          {children}
        </div>
      </main>
    </div>
  );
}