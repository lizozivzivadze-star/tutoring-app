import TeacherTabs from "./teacher-tabs";

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
        <button
          aria-label="მენიუ"
          className="flex flex-col gap-1 w-6 shrink-0"
        >
          <span className="h-0.5 bg-ink rounded-full" />
          <span className="h-0.5 bg-ink rounded-full" />
          <span className="h-0.5 bg-ink rounded-full" />
        </button>
      </header>

      <TeacherTabs />

      <main className="px-6 py-8 max-w-sm mx-auto">{children}</main>
    </div>
  );
}
