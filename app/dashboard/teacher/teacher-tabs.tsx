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
    <nav className="bg-white px-6 flex justify-center gap-5">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 pt-3 pb-2.5 text-lg font-medium rounded-t-lg transition-colors ${
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