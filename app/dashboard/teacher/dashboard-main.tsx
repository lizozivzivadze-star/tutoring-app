"use client";

import { usePathname } from "next/navigation";

export default function DashboardMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTestDetail =
    /^\/dashboard\/teacher\/tests\/[^/]+$/.test(pathname) &&
    !pathname.endsWith("/tests/new");

  return (
    <main
      className={`py-8 mx-auto ${
        isTestDetail ? "w-[80vw]" : "px-6 max-w-sm"
      }`}
    >
      <div className={isTestDetail ? "" : "p-5"}>{children}</div>
    </main>
  );
}