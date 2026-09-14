"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import UserMenu from "@/components/user-menu";

type PendingTest = {
  sentTestId: string;
  title: string;
  themeName: string;
  typeLabel: string;
};

type CompletedTest = {
  attemptId: string;
  testTitle: string;
  completedAt: string;
  score: number;
  totalQuestions: number;
};

export default function StudentDashboard() {
  const [pending, setPending] = useState<PendingTest[] | null>(null);
  const [completed, setCompleted] = useState<CompletedTest[] | null>(null);

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setPending(data.pending ?? []);
        setCompleted(data.completed ?? []);
      });
  }, []);

  return (
    <div className="min-h-screen">
      <header className="ruled-edge bg-white px-6 py-4 flex items-center gap-4">
        <UserMenu />
      </header>

      <main className="px-6 py-8 max-w-sm mx-auto flex flex-col gap-8">
        <section className="rounded-lg p-4 bg-[#fff7e6] border border-[#f0dfb5]">
          <h2 className="font-display text-lg text-ink border-b border-paper-line pb-2 mb-3">
            ახალი ტესტები
          </h2>

          {pending === null && (
            <p className="text-ink-soft text-sm">იტვირთება...</p>
          )}
          {pending?.length === 0 && (
            <p className="text-ink-soft text-sm">ახალი ტესტი არ არის.</p>
          )}
          <ul className="flex flex-col gap-2">
            {pending?.map((t) => (
              <li key={t.sentTestId}>
                <Link
                  href={`/dashboard/student/take/${t.sentTestId}`}
                  className="flex items-center gap-2 text-ink hover:text-marker"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-marker shrink-0" />
                  <span>
                    {t.title}{" "}
                    <span className="text-ink-soft text-sm">
                      ({t.themeName} · {t.typeLabel})
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

       <section className="rounded-lg p-4 bg-[#e4efec] border border-[#e7e1d3]">
          <h2 className="font-display text-lg text-ink border-b border-paper-line pb-2 mb-3">
            უკვე გაკეთებული ტესტები
          </h2>

          {completed === null && (
            <p className="text-ink-soft text-sm">იტვირთება...</p>
          )}
          {completed?.length === 0 && (
            <p className="text-ink-soft text-sm">ჯერ არაფერი გაქვთ გაკეთებული.</p>
          )}
{completed && completed.length > 0 && (
  <table className="w-full text-sm table-fixed border border-paper-line">
<colgroup>
  <col className="w-[30%]" />
  <col className="w-[26%]" />
  <col className="w-[24%]" />
  <col className="w-[20%]" />
</colgroup>
    <thead>
      <tr className="text-left text-ink-soft border-b border-paper-line">
        <th className="py-2 px-2 font-medium border-r border-paper-line text-left">ტესტი</th>
        <th className="py-2 px-2 font-medium border-r border-paper-line text-left">თარიღი</th>
        <th className="py-2 px-2 font-medium border-r border-paper-line text-left">შედეგი</th>
        <th className="py-2 px-2 font-medium text-left">review</th>
      </tr>
    </thead>
    <tbody>
      {completed.map((c) => (
        <tr key={c.attemptId} className="border-b border-paper-line">
          <td className="py-2 px-2 text-ink border-r border-paper-line text-left overflow-hidden">
            <span className="block truncate">{c.testTitle}</span>
          </td>
          <td className="py-2 px-2 text-ink-soft border-r border-paper-line text-left">
            {new Date(c.completedAt).toLocaleDateString("ka-GE")}
          </td>
          <td className="py-2 px-2 text-ink border-r border-paper-line text-left whitespace-nowrap">
  {c.score}/{c.totalQuestions}
</td>
          <td className="py-2 px-2 text-left">
            <Link
              href={`/dashboard/student/results/${c.attemptId}/review`}
              className="text-marker font-medium"
            >
              review
            </Link>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)}
        </section>
      </main>
    </div>
  );
}
