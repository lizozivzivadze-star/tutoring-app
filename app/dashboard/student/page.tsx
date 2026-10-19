"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import UserMenu from "@/components/user-menu";
import LogoLink from "@/components/logo-link";
import LoadingBar from "@/components/loading-bar";
import SentTestsArchive from "@/components/sent-tests-archive";

type PendingTest = {
  sentTestId: string;
  title: string;
  themeName: string;
  typeLabel: string;
};

type GroupInfo = {
  name: string;
  teacherName: string | null;
};

export default function StudentDashboard() {
  const [pending, setPending] = useState<PendingTest[] | null>(null);
  const [name, setName] = useState<string | null>(null);
    const [group, setGroup] = useState<GroupInfo | null>(null);

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setPending(data.pending ?? []);
        setName(data.name ?? null);
        setGroup(data.group ?? null);
      });
  }, []);

  return (
    <div className="min-h-screen">
      <header className="ruled-edge bg-white px-6 py-6 flex items-center justify-between gap-4">
  <LogoLink />
  <UserMenu />
</header>

      <main className="py-8 flex flex-col gap-8 mx-auto w-[90%]">
              {group && (
          <section className="text-sm text-ink flex flex-col gap-1 px-1">
            <p>
              <span className="text-ink-soft">საგანი: </span>ისტორია
            </p>
            {group.teacherName && (
              <p>
                <span className="text-ink-soft">მასწავლებელი: </span>
                {group.teacherName}
              </p>
            )}
            <p>
              <span className="text-ink-soft">ჯგუფი: </span>
              {group.name}
            </p>
          </section>
        )}
        <section className="rounded-lg p-4 bg-fresh border border-fresh-line">
          <h2 className="font-display text-lg text-ink border-b border-paper-line pb-2 mb-3">
            ახალი ტესტები
          </h2>

          {pending === null && (
           <LoadingBar className="py-3" />
          )}
          {pending?.length === 0 && (
            <p className="text-ink-soft text-sm">ახალი ტესტი არ არის.</p>
          )}
          <ul className="flex flex-col gap-3">
            {pending?.map((t) => (
              <li key={t.sentTestId}>
                <Link
                  href={`/dashboard/student/take/${t.sentTestId}`}
                  className="flex items-center gap-2 text-ink hover:text-marker bg-fresh-line/50 rounded-md px-3 py-3"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-marker shrink-0" />
                  <span>
{t.title}{" "}
<span className="text-ink-soft text-sm">
  [{t.typeLabel}]
</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
                <SentTestsArchive endpoint="/api/student/archive" studentMode />
      </main>
    </div>
  );
}
