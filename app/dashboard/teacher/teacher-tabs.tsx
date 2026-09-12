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
    <nav className="bg-paper-line px-6 pt-2 flex justify-center gap-1">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 text-base font-medium rounded-t-md transition-colors ${
              active
                ? "bg-paper text-ink"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}