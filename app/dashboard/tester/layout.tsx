import TesterTabs from "./tester-tabs";
import UserMenu from "@/components/user-menu";

export default function TesterDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-20 bg-white">
        <header className="ruled-edge bg-white px-6 py-6 flex items-center gap-4">
          <UserMenu />
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