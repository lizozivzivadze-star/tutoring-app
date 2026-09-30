"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import LoadingBar from "@/components/loading-bar";
import HScrollText from "@/components/h-scroll-text";

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

function formatDuration(s: number | null) {
  if (s === null || s === undefined) return "—";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}სთ ${m}წთ ${sec}წმ`;
  if (m > 0) return `${m}წთ ${sec}წმ`;
  return `${sec}წმ`;
}

export default function TesterStudentHistoryPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [completed, setCompleted] = useState<CompletedTest[] | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/tester/students/${studentId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setStudent(data.student))
      .catch(() => setNotFound(true));

    fetch(`/api/tester/students/${studentId}/history`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setCompleted(data.completed))
      .catch(() => setNotFound(true));
  }, [studentId]);

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="w-[80vw] relative left-1/2 -ml-[40vw]">
        <Link
          href="/dashboard/tester/groups"
          className="text-sm text-marker font-medium"
        >
          ← უკან
        </Link>

        {notFound ? (
          <p className="text-sm text-marker-dark text-center py-12">
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
              <div className="overflow-x-auto">
                <table className="w-[157%] table-fixed text-sm border-collapse border border-[#d3cbb8]">
                  <colgroup>
                    <col className="w-[41%]" />
                    <col className="w-[18%]" />
                    <col className="w-[15%]" />
                    <col className="w-[12%]" />
                    <col className="w-[14%]" />
                  </colgroup>
                  <thead>
                    <tr className="text-ink-soft border-b border-[#d3cbb8]">
                      <th className="py-2 px-1.5 font-medium text-left whitespace-nowrap overflow-hidden border-r border-[#d3cbb8]">ტესტი</th>
                      <th className="py-2 px-1.5 font-medium text-left whitespace-nowrap overflow-hidden border-r border-[#d3cbb8]">თარიღი</th>
                      <th className="py-2 px-1.5 font-medium text-center whitespace-nowrap overflow-hidden border-r border-[#d3cbb8]">შედეგი</th>
                      <th className="py-2 px-1.5 font-medium text-center whitespace-nowrap overflow-hidden border-r border-[#d3cbb8]">დრო</th>
                      <th className="py-2 px-1.5 font-medium text-left whitespace-nowrap overflow-hidden">review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completed.map((c) => (
                      <tr key={c.attemptId} className="border-b border-[#d3cbb8] last:border-b-0">
                        <td className="py-2 px-1.5 text-ink border-r border-[#d3cbb8] overflow-hidden">
                          <HScrollText>
                            {c.testTitle}{" "}
                            <span className="text-ink-soft text-xs">
                              ({c.themeName})
                            </span>
                          </HScrollText>
                        </td>
                        <td className="py-2 px-1.5 text-xs text-ink-soft whitespace-nowrap overflow-hidden border-r border-[#d3cbb8]">
                          {new Date(c.completedAt).toLocaleDateString("ka-GE")}
                        </td>
                        <td className="py-2 px-1.5 text-center text-ink whitespace-nowrap border-r border-[#d3cbb8]">
                          {c.score}/{c.totalQuestions}
                        </td>
                        <td className="py-2 px-1.5 text-center text-xs text-ink-soft whitespace-nowrap overflow-hidden border-r border-[#d3cbb8]">
                          {formatDuration(c.durationSeconds)}
                        </td>
                        <td className="py-2 px-1.5 overflow-hidden">
                          <Link
                            href={`/dashboard/tester/groups/students/${studentId}/history/${c.attemptId}`}
                            className="text-marker font-medium"
                          >
                            review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}