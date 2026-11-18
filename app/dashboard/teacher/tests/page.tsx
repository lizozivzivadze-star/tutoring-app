"use client";

import { useEffect, useState, useCallback } from "react";
import { ThemeRecord } from "./types";
import ThemeCard from "./theme-card";
import LoadingBar from "@/components/loading-bar";
import { TestsStats } from "@/components/stats-block";

// მასწავლებლის „ტესტები" ტაბი — მხოლოდ სანახავად (დაგეგმვისთვის).
// ტესტერის ჩამონათვალის ასლია, ოღონდ დამატების, რედაქტირების და
// წაშლის გარეშე. ჩანს მხოლოდ გამოქვეყნებული ტესტები.
export default function TeacherTestsTab() {
  const [themes, setThemes] = useState<ThemeRecord[] | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const res = await fetch("/api/themes");
    const data = await res.json();
    setThemes(data.themes ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (!themes) {
    return <LoadingBar />;
  }

  // სტატისტიკა: ზუსტად ის, რაც ქვემოთ სიაში ჩანს (გამოქვეყნებული ტესტები,
  // შეკითხვები ბოლო გამოქვეყნებული ვერსიიდან)
  const shownTests = themes.flatMap((th) => th.tests.filter((t) => t.published));
  const shownQuestions = shownTests.reduce(
    (sum, t) => sum + (t.publishedQuestionCount ?? 0),
    0
  );

  return (
    <div>
      <div className="mb-5">
        <TestsStats tests={shownTests.length} questions={shownQuestions} />
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="border-b border-paper-line pb-[5px] -mb-[5px]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-body text-[17.5px] font-medium text-ink">
              თემები & ტესტები
            </h2>
          </div>
        </div>

        {themes.length === 0 && (
          <p className="text-ink-soft text-sm text-center py-8">
            ჯერ არცერთი თემა არ არის დამატებული.
          </p>
        )}

        {themes.map((theme, i) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            themeIndex={i}
            expanded={expandedIds.has(theme.id)}
            onToggleExpand={() => toggleExpand(theme.id)}
          />
        ))}
      </div>
    </div>
  );
}
