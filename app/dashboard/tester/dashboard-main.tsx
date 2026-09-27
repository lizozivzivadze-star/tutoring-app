"use client";

import { usePathname } from "next/navigation";

export default function DashboardMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTestDetail =
    /^\/dashboard\/tester\/tests\/[^/]+$/.test(pathname) &&
    !pathname.endsWith("/tests/new");

  return (
    <main className={`px-6 py-8 mx-auto ${isTestDetail ? "max-w-[80%]" : "max-w-sm"}`}>
      <div className="p-5">{children}</div>
    </main>
  );
}