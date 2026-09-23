"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard/teacher", label: "START" },
  { href: "/dashboard/teacher/groups", label: "ჯგუფები" },
];

export default function TeacherTabs() {
  const pathname = usePathname();
  const activeHref = [...TABS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((t) => pathname === t.href || pathname.startsWith(t.href + "/"))?.href;

  return (
    <nav className="bg-white px-6 flex justify-center gap-5">
      {TABS.map((tab) => {
        const active = tab.href === activeHref;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 pt-[1.125rem] pb-[0.9375rem] text-[17.5px] font-medium rounded-t-lg transition-colors ${
              active ? "bg-paper text-marker" : "text-ink-soft hover:text-marker"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}