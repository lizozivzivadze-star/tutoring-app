import TeacherTabs from "./teacher-tabs";
import UserMenu from "@/components/user-menu";

export default function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="ruled-edge bg-white px-6 py-4 flex items-center gap-4">
        {/* Menu icon from the sketch — wired to a real drawer once
            we build the navigation cube. */}
        <UserMenu />
      </header>

      <TeacherTabs />

      <main className="px-6 py-8 max-w-sm mx-auto">
        <div className="p-5">
          {children}
        </div>
      </main>
    </div>
  );
}
