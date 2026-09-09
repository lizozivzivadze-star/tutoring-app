"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type ReviewData = {
  attemptId: string;
  testTitle: string;
  completedAt: string;
  studentEmail: string;
  questions: {
    id: string;
    prompt: string;
    correctAnswer: string;
    yourAnswer: string;
  }[];
};

export default function TeacherAttemptReviewPage() {
  const { studentId, attemptId } = useParams<{
    studentId: string;
    attemptId: string;
  }>();
  const [data, setData] = useState<ReviewData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/teacher/attempts/${attemptId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setNotFound(true));
  }, [attemptId]);

  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-marker-dark">შედეგი ვერ მოიძებნა.</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-ink-soft text-sm">იტვირთება...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="max-w-sm mx-auto">
        <Link
          href={`/dashboard/teacher/groups/students/${studentId}/history`}
          className="text-sm text-marker font-medium"
        >
          ← უკან
        </Link>

        <h1 className="font-display text-lg text-ink border-b border-paper-line pb-2 mt-4 mb-4">
          შედეგის განხილვა
        </h1>

        <ul className="text-sm text-ink-soft flex flex-col gap-1 mb-6">
          <li>• ტესტი: {data.testTitle}</li>
          <li>
            • ჩაბარების დრო:{" "}
            {new Date(data.completedAt).toLocaleString("ka-GE")}
          </li>
          <li>• მოსწავლის email: {data.studentEmail}</li>
        </ul>

        <div className="flex flex-col gap-4 border-t border-paper-line pt-4">
          {data.questions.map((q, i) => (
            <div key={q.id} className="border-b border-paper-line pb-4">
              <p className="text-ink text-sm mb-2">
                <span className="text-ink-soft">შ{i + 1}.</span> {q.prompt}
              </p>
              <p className="text-sm text-ledger">
                სწორი პასუხია: {q.correctAnswer}
              </p>
              <p
                className={`text-sm ${
                  q.yourAnswer === q.correctAnswer
                    ? "text-ledger"
                    : "text-marker-dark"
                }`}
              >
                თქვენი პასუხი: {q.yourAnswer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
