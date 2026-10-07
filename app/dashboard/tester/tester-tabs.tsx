"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard/tester", label: "დაიწყე ტესტი" },
  { href: "/dashboard/tester/tests", label: "ტესტები" },
  { href: "/dashboard/tester/groups", label: "ჯგუფები" },
];

export default function TesterTabs() {
  const pathname = usePathname();
  const activeHref = [...TABS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((t) => pathname === t.href || pathname.startsWith(t.href + "/"))?.href;

  return (
    <nav className="bg-white px-[0.35rem] flex justify-center gap-1">
      {TABS.map((tab) => {
        const active = tab.href === activeHref;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-auto text-center px-2 pt-[1.125rem] pb-[0.9375rem] text-[17.5px] font-medium whitespace-nowrap rounded-t-lg transition-colors ${
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