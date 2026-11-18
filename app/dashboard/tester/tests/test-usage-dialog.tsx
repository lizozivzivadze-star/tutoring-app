"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import HScrollText from "@/components/h-scroll-text";
import VScrollBox from "@/components/v-scroll-box";
import UiIcon from "@/components/ui-icon";
import LoadingBar from "@/components/loading-bar";

type Student = { id: string; name: string };
type DoneTest = { id: string; title: string; score: number; total: number };

// „ტესტები #" ანგარიში: ვინ გააკეთა ტესტი → (results ხატულა) ამ მოსწავლის
// ყველა გაკეთებული ტესტი. ორივე ეკრანი ერთსა და იმავე ფანჯარაშია.
export default function TestUsageDialog({
  testId,
  onClose,
}: {
  testId: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [students, setStudents] = useState<Student[] | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [tests, setTests] = useState<DoneTest[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/tester/test-usage/${testId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setTitle(data.title ?? "");
        setStudents(data.students ?? []);
      })
      .catch(() => setError("ჩატვირთვა ვერ მოხერხდა."));
  }, [testId]);

  function openStudent(s: Student) {
    setStudent(s);
    setTests(null);
    setError("");
    fetch(`/api/tester/test-usage/${testId}/${s.id}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setTests(data.tests ?? []))
      .catch(() => setError("ჩატვირთვა ვერ მოხერხდა."));
  }

  function back() {
    setStudent(null);
    setTests(null);
    setError("");
  }

  if (typeof document === "undefined") return null;

  const rowClass =
    "col-span-full grid grid-cols-subgrid items-center gap-x-3 py-2 border-b border-paper-line last:border-b-0";

  let body: React.ReactNode;
  if (error) {
    body = <p className="text-sm text-danger text-center py-4">{error}</p>;
  } else if (!student) {
    if (students === null) body = <LoadingBar className="py-3" />;
    else if (students.length === 0)
      body = (
        <p className="text-sm text-ink-soft text-center py-4">
          ეს ტესტი ჯერ არავის გაუკეთებია
        </p>
      );
    else
      body = (
        <div className="grid grid-cols-[minmax(0,1fr)_max-content] text-sm text-ink">
          {students.map((s) => (
            <div key={s.id} className={rowClass}>
              <HScrollText className="min-w-0">{s.name}</HScrollText>
              <button
                type="button"
                onClick={() => openStudent(s)}
                aria-label="მოსწავლის გაკეთებული ტესტები"
                className="flex justify-end"
              >
                <UiIcon name="results" />
              </button>
            </div>
          ))}
        </div>
      );
  } else {
    if (tests === null) body = <LoadingBar className="py-3" />;
    else if (tests.length === 0)
      body = (
        <p className="text-sm text-ink-soft text-center py-4">
          გაკეთებული ტესტი არ არის
        </p>
      );
    else
      body = (
        <div className="grid grid-cols-[minmax(0,1fr)_max-content] text-sm text-ink">
          {tests.map((t) => (
            <div key={t.id} className={rowClass}>
              <HScrollText className="min-w-0">{t.title}</HScrollText>
              <span className="whitespace-nowrap text-right">
                {t.score}/{t.total}
              </span>
            </div>
          ))}
        </div>
      );
  }

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-md border border-paper-line w-[75vw] h-[75dvh] px-4 py-3 flex flex-col">
        <div className="flex items-center gap-2 border-b border-paper-line pb-2 mb-1 shrink-0">
          {student ? (
            <>
              <button
                type="button"
                onClick={back}
                className="shrink-0 text-sm text-marker font-medium hover:text-marker-hover"
              >
                ← უკან
              </button>
              <HScrollText className="flex-1 min-w-0 font-medium text-ink text-sm">
                {student.name}
              </HScrollText>
            </>
          ) : (
            <HScrollText className="flex-1 min-w-0 font-medium text-ink text-sm">
              {title}
            </HScrollText>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="დახურვა"
            className="icon-btn shrink-0 text-ink-soft hover:text-marker"
          >
            <UiIcon name="x" />
          </button>
        </div>

        <VScrollBox
          key={student?.id ?? "students"}
          drag={false}
          showScrollbar
          className="h-[calc(75dvh-4.5rem)] pr-3"
        >
          {body}
        </VScrollBox>
      </div>
    </div>,
    document.body
  );
}
