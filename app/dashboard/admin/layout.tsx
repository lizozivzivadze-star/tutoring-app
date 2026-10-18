import AdminTabs from "./admin-tabs";
import UserMenu from "@/components/user-menu";
import HideOnScroll from "@/components/hide-on-scroll";
import LogoLink from "@/components/logo-link";
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
      <HideOnScroll>
        <header className="ruled-edge bg-white px-6 py-6 flex items-center justify-between gap-4">
          <LogoLink />
          <UserMenu />
        </header>

        <AdminTabs />
      </HideOnScroll>

<main className="py-8 mx-auto w-[90%]">{children}</main>
    </div>
  );
}