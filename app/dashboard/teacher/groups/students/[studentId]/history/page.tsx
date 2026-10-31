"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import LoadingBar from "@/components/loading-bar";
import HScrollText from "@/components/h-scroll-text";
import { formatDuration } from "@/lib/format-time";
import UiIcon from "@/components/ui-icon";

function ymd(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

type CompletedTest = {
  attemptId: string;
  testTitle: string;
  themeName: string;
  completedAt: string;
  score: number;
  totalQuestions: number;
  durationSeconds: number | null;
};

type StudentInfo = { name: string | null; surname: string | null };

export default function StudentHistoryPage() {
  const { studentId } = useParams<{ studentId: string }>();
    const router = useRouter();
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [completed, setCompleted] = useState<CompletedTest[] | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/students/${studentId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setStudent(data.student))
      .catch(() => setNotFound(true));

    fetch(`/api/students/${studentId}/history`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setCompleted(data.completed))
      .catch(() => setNotFound(true));
  }, [studentId]);

  return (
<main className="min-h-screen py-8">
  <div>
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) router.back();
            else router.push("/dashboard/teacher/groups");
          }}
          className="text-sm text-marker font-medium"
        >
          ← უკან
        </button>

        {notFound ? (
          <p className="text-sm text-danger text-center py-12">
            მოსწავლე ვერ მოიძებნა.
          </p>
        ) : (
          <>
            <h1 className="font-display text-lg text-ink mt-4 mb-1">
              {student
                ? `${student.name ?? ""} ${student.surname ?? ""}`.trim() ||
                  "მოსწავლე"
                : "..."}
            </h1>
            <p className="text-sm text-ink-soft mb-8">დასრულებული ტესტები</p>

            {completed === null && (
              <LoadingBar className="py-3" />
            )}
            {completed?.length === 0 && (
              <p className="text-ink-soft text-sm text-center py-12">
                ჯერ არაფერი აქვს გაკეთებული.
              </p>
            )}
                        {completed && completed.length > 0 && (
              <div
                className="grid w-full gap-y-[3px]"
                style={{ gridTemplateColumns: "max-content minmax(0,1fr) max-content max-content" }}
              >
                {/* სათაური */}
                <div className="col-span-full grid grid-cols-subgrid items-center gap-x-2 border border-transparent px-2 font-body text-ink-soft">
                  <div className="min-w-0 text-center [contain:inline-size]">
                    <HScrollText className="text-center">თარიღი</HScrollText>
                  </div>
                  <HScrollText className="min-w-0 text-center">ტესტი</HScrollText>
                  <div className="min-w-0 text-center [contain:inline-size]">
                    <HScrollText className="text-center">დრო</HScrollText>
                  </div>
                  {/* სვეტის სიგანე = სიტყვა „შედეგი“; ხილულია მხოლოდ პიქტოგრამა */}
                  <div className="relative flex justify-center">
                    <span className="invisible">შედეგი</span>
                    <span className="absolute inset-0 flex items-center justify-center">
                      <UiIcon name="results" />
                    </span>
                  </div>
                </div>

                {completed.map((c) => (
                  <div
                    key={c.attemptId}
                    className="col-span-full grid grid-cols-subgrid items-center gap-x-2 rounded-md border border-paper-line bg-white px-2 py-1.5 font-body text-ink"
                  >
                    <span className="whitespace-nowrap text-ink-soft">
                      {ymd(c.completedAt)}
                    </span>
                    <HScrollText className="min-w-0">{c.testTitle}</HScrollText>
                    <span className="whitespace-nowrap">
                      {formatDuration(c.durationSeconds)}
                    </span>
                    <Link
                      href={`/dashboard/teacher/groups/students/${studentId}/history/${c.attemptId}`}
                      className="whitespace-nowrap text-center text-marker underline underline-offset-2"
                    >
                      {c.score}/{c.totalQuestions}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}