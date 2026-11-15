"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PublishedSnapshot, TestTemplate, TYPE_LABELS } from "../types";
import LoadingBar from "@/components/loading-bar";
import UiIcon from "@/components/ui-icon";

type TeacherTestView = {
  id: string;
  type: TestTemplate;
  activated: boolean;
  publishedSnapshot: PublishedSnapshot;
};

// მასწავლებლისთვის ტესტის ნახვა — რედაქტირებისა და წაშლის გარეშე.
// ჩანს ბოლო გამოქვეყნებული ვერსია.
export default function TeacherTestViewPage() {
  const { testId } = useParams<{ testId: string }>();
  const [test, setTest] = useState<TeacherTestView | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/teacher/tests/${testId}`)
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setTest(data.test);
      })
      .catch(() => setNotFound(true));
  }, [testId]);

  if (notFound) {
    return (
      <p className="text-sm text-danger text-center py-12">
        ტესტი ვერ მოიძებნა.{" "}
        <Link href="/dashboard/teacher/tests" className="text-marker font-medium">
          უკან
        </Link>
      </p>
    );
  }

  if (!test) {
    return <LoadingBar />;
  }

  const display = test.publishedSnapshot;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Link
          href="/dashboard/teacher/tests"
          className="text-sm text-marker font-medium"
        >
          ← უკან
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {display.title}
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                test.activated
                  ? "bg-ledger-soft text-ledger"
                  : "bg-paper-line/60 text-ink-soft"
              }`}
            >
              {test.activated ? "active" : "published"}
            </span>
          </div>
          <p className="text-xs text-ink-soft">{TYPE_LABELS[test.type]}</p>
        </div>

        <div className="flex flex-col gap-3 border-t border-paper-line pt-4">
          {display.questions.map((q, i) => (
            <div
              key={i}
              className="border border-paper-line rounded-sm p-3 bg-paper"
            >
              <p className="text-sm text-ink mb-2">
                <span className="text-ink-soft">შ{i + 1}.</span> {q.prompt}
              </p>
              <div className="flex flex-col gap-1 pl-5">
                {q.options.map((o, oi) => (
                  <p
                    key={oi}
                    className={`text-sm ${
                      o.isCorrect ? "text-ledger font-medium" : "text-ink-soft"
                    }`}
                  >
                    პ{oi + 1}. {o.text}
                    {o.isCorrect && <UiIcon name="check" className="ml-1" />}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
