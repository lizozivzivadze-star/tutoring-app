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
    <nav className="relative z-10 bg-white flex justify-center gap-6 px-6 pt-3 -mb-0.5">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              active
                ? "px-4 pt-2 pb-2.5 text-sm font-medium text-marker bg-white border-2 border-marker border-b-white rounded-t-md"
                : "px-4 py-3 text-sm font-medium text-ink-soft hover:text-ink"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}