"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LoadingBar from "@/components/loading-bar";
import { formatDateTime, formatDuration } from "@/lib/format-time";

type ReviewData = {
  attemptId: string;
  testTitle: string;
  completedAt: string;
  durationSeconds: number | null;
  studentName: string;
  questions: {
    id: string;
    prompt: string;
    correctAnswer: string;
    yourAnswer: string;
  }[];
};

export default function TesterAttemptReviewPage() {
  const { studentId, attemptId } = useParams<{
    studentId: string;
    attemptId: string;
  }>();
    const router = useRouter();
  const [data, setData] = useState<ReviewData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/tester/attempts/${attemptId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setNotFound(true));
  }, [attemptId]);

  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-danger">შედეგი ვერ მოიძებნა.</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingBar />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="w-[80vw] relative left-1/2 -ml-[40vw]">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) router.back();
            else router.push(`/dashboard/tester/groups/students/${studentId}/history`);
          }}
          className="text-sm text-marker font-medium"
        >
          ← უკან
        </button>

        <h1 className="font-display text-lg text-ink border-b border-paper-line pb-2 mt-4 mb-4">
          შედეგის განხილვა
        </h1>

        <ul className="text-sm text-ink-soft flex flex-col gap-1 mb-6">
<li>ტესტი: {data.testTitle}</li>
<li>ჩატარების დრო: {formatDateTime(data.completedAt)}</li>
<li>{data.studentName}</li>
<li>ხანგრძლივობა: {formatDuration(data.durationSeconds)}</li>
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
                    : "text-danger"
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