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
    <nav className="ruled-edge bg-white px-6 flex justify-center gap-6">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`py-3 text-base font-medium border-b-2 transition-colors ${
              active
                ? "border-marker text-marker bg-ink/[0.04]"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}