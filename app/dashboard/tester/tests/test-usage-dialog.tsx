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

  // ორივე ეკრანზე ერთი და იგივე სვეტები: სახელს/სათაურს მეტი ადგილი აქვს,
  // მარჯვენა სვეტი ვერტიკალური ხაზით არის გამოყოფილი
  const gridClass = "grid grid-cols-[minmax(0,82fr)_minmax(0,18fr)] text-sm text-ink";
  const rowClass =
    "col-span-full grid grid-cols-subgrid border-b border-paper-line last:border-b-0";
  const leftCell = "min-w-0 py-2 pr-3";
  const rightCell =
    "flex items-center justify-center py-2 pl-2 border-l border-paper-line whitespace-nowrap";

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
        <div className={gridClass}>
          {students.map((s) => (
            <div key={s.id} className={rowClass}>
              <HScrollText className={leftCell}>{s.name}</HScrollText>
              <button
                type="button"
                onClick={() => openStudent(s)}
                aria-label="მოსწავლის გაკეთებული ტესტები"
                className={rightCell}
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
        <div className={gridClass}>
          {tests.map((t) => (
            <div key={t.id} className={rowClass}>
              <HScrollText className={leftCell}>{t.title}</HScrollText>
              <span className={rightCell}>
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
      <div className="bg-white rounded-md border border-paper-line w-[75vw] h-[50dvh] px-4 py-3 flex flex-col">
        <div className="border-b border-paper-line pb-2 mb-1 shrink-0">
          <div className="flex items-center gap-2">
            {student ? (
              <button
                type="button"
                onClick={back}
                className="flex-1 text-left text-sm text-marker font-medium hover:text-marker-hover"
              >
                ← უკან
              </button>
            ) : (
              <HScrollText className="flex-1 min-w-0 font-bold text-marker text-sm">
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
          {student && (
            <HScrollText className="min-w-0 mt-1 font-bold text-marker text-sm">
              {student.name}
            </HScrollText>
          )}
        </div>

        <VScrollBox
          key={student?.id ?? "students"}
          drag={false}
          showScrollbar
          className={`${
            student ? "h-[calc(50dvh-6rem)]" : "h-[calc(50dvh-4.5rem)]"
          } pr-3`}
        >
          {body}
        </VScrollBox>
      </div>
    </div>,
    document.body
  );
}
