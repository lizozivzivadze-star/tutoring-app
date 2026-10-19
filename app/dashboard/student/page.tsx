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
  const [newOpen, setNewOpen] = useState(true);

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
                <div className="w-full flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setNewOpen((v) => !v)}
            aria-expanded={newOpen}
            className="w-full rounded-md border-2 border-marker text-marker font-body
                       font-medium py-2.5 transition-colors hover:bg-paper"
          >
            ახალი ტესტები
          </button>

          {newOpen && (
            <div className="bg-white border border-paper-line rounded-md overflow-hidden">
              {pending === null && <LoadingBar className="py-3" />}

              {pending?.length === 0 && (
                <p className="px-3 py-3 text-sm text-ink-soft text-center">
                  ახალი ტესტი არ არის.
                </p>
              )}

              {pending?.map((t) => (
                <Link
                  key={t.sentTestId}
                  href={`/dashboard/student/take/${t.sentTestId}`}
                  className="flex items-center gap-2 px-3 py-3 text-sm text-ink hover:text-marker
                             border-b border-paper-line last:border-b-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-marker shrink-0" />
                  <span>
                    {t.title}{" "}
                    <span className="text-ink-soft text-xs">[{t.typeLabel}]</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
                <SentTestsArchive endpoint="/api/student/archive" studentMode />
      </main>
    </div>
  );
}
