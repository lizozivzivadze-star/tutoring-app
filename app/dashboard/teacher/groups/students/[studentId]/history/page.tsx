"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import LoadingBar from "@/components/loading-bar";
import VScrollBox from "@/components/v-scroll-box";
import { formatDate, formatDuration } from "@/lib/format-time";

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
    <main className="min-h-screen px-6 py-8">
      <div className="w-[90vw] relative left-1/2 -ml-[45vw]">
        <Link
          href="/dashboard/teacher/groups"
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
              <table className="w-full text-sm border-collapse border border-[#d3cbb8]">
                <thead>
                  <tr className="text-ink-soft border-b border-[#d3cbb8]">
                    <th className="py-2 px-1.5 font-medium text-left whitespace-nowrap overflow-hidden border-r border-[#d3cbb8]">ტესტი</th>
                    <th className="w-[1%] py-2 px-1.5 font-medium text-xs text-left whitespace-nowrap border-r border-[#d3cbb8]">თარიღი</th>
                    <th className="w-[1%] py-2 px-1.5 font-medium text-xs text-center whitespace-nowrap border-r border-[#d3cbb8]">შედეგი</th>
                    <th className="w-[1%] py-2 px-1.5 font-medium text-xs text-center whitespace-nowrap border-r border-[#d3cbb8]">დრო</th>
                    <th className="w-[1%] py-2 px-1.5 font-medium text-xs text-left whitespace-nowrap">review</th>
                  </tr>
                </thead>
                <tbody>
                  {completed.map((c) => (
                    <tr key={c.attemptId} className="border-b border-[#d3cbb8] last:border-b-0">
                      <td className="py-2 px-1.5 text-ink border-r border-[#d3cbb8] overflow-hidden align-middle">
<VScrollBox className="h-[3.75rem] leading-5 [overflow-wrap:anywhere]">
  <div className="min-h-full flex items-center">
                            <div>
                              {c.testTitle}{" "}
                              <span className="text-ink-soft text-xs">
                                ({c.themeName})
                              </span>
                            </div>
                          </div>
                        </VScrollBox>
                      </td>
                      <td className="py-2 px-1.5 text-xs text-ink-soft whitespace-nowrap border-r border-[#d3cbb8] align-middle">
                        {formatDate(c.completedAt)}
                      </td>
                      <td className="py-2 px-1.5 text-center text-ink whitespace-nowrap border-r border-[#d3cbb8] align-middle">
                        {c.score}/{c.totalQuestions}
                      </td>
                      <td className="py-2 px-1.5 text-center text-xs text-ink-soft whitespace-nowrap border-r border-[#d3cbb8] align-middle">
                        {formatDuration(c.durationSeconds)}
                      </td>
                      <td className="py-2 px-1.5 whitespace-nowrap align-middle">
                        <Link
                          href={`/dashboard/teacher/groups/students/${studentId}/history/${c.attemptId}`}
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
          </>
        )}
      </div>
    </main>
  );
}