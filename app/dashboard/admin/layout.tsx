import AdminTabs from "./admin-tabs";
import UserMenu from "@/components/user-menu";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="ruled-edge bg-white px-6 py-4 flex items-center gap-4">
        <UserMenu />
        <span className="font-display text-ink text-lg">Admin</span>
      </header>

      <AdminTabs />

      <main className="px-6 py-8 max-w-sm mx-auto">
        <div className="p-5">{children}</div>
      </main>
    </div>
  );
}
