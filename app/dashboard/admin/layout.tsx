import AdminTabs from "./admin-tabs";
import UserMenu from "@/components/user-menu";
import Greeting from "@/components/greeting";
import { prisma } from "@/lib/prisma";
import { getCurrentAdminId } from "@/lib/current-admin";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const id = await getCurrentAdminId();
  const admin = id
    ? await prisma.admin.findUnique({ where: { id }, select: { name: true } })
    : null;

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-20 bg-white">
        <header className="ruled-edge bg-white px-6 py-6 flex items-center justify-between gap-4">
          <Greeting name={admin?.name} />
          <UserMenu />
        </header>

        <AdminTabs />
      </div>

      <main className="px-6 py-8 max-w-sm mx-auto">
        <div className="p-5">{children}</div>
      </main>
    </div>
  );
}