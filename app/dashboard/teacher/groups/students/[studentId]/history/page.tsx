"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type CompletedTest = {
  attemptId: string;
  testTitle: string;
  themeName: string;
  completedAt: string;
  score: number;
  totalQuestions: number;
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
    <main className="min-h-screen px-6 py-8 max-w-sm mx-auto">
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
            <p className="text-ink-soft text-sm">იტვირთება...</p>
          )}
          {completed?.length === 0 && (
            <p className="text-ink-soft text-sm text-center py-12">
              ჯერ არაფერი აქვს გაკეთებული.
            </p>
          )}
          {completed && completed.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-soft border-b border-paper-line">
                  <th className="py-2 font-medium">ტესტი</th>
                  <th className="py-2 font-medium">თარიღი</th>
                  <th className="py-2 font-medium">შედეგი</th>
                  <th className="py-2 font-medium">review</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((c) => (
                  <tr key={c.attemptId} className="border-b border-paper-line">
                    <td className="py-2 text-ink">
                      {c.testTitle}{" "}
                      <span className="text-ink-soft text-xs">
                        ({c.themeName})
                      </span>
                    </td>
                    <td className="py-2 text-ink-soft">
                      {new Date(c.completedAt).toLocaleDateString("ka-GE")}
                    </td>
                    <td className="py-2 text-ink">
                      {c.score}/{c.totalQuestions}
                    </td>
                    <td className="py-2">
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
    </main>
  );
}
