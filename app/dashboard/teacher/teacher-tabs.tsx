"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard/teacher", label: "START" },
  { href: "/dashboard/teacher/tests", label: "ტესტები" },
  { href: "/dashboard/teacher/groups", label: "ჯგუფები" },
];

export default function TeacherTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex justify-center gap-6 px-6 pt-4 pb-2">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`text-base font-semibold uppercase tracking-wide transition-colors ${
              active ? "text-marker" : "text-ink-soft hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}