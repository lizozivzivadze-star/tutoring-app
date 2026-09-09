"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const AUTO_RETURN_SECONDS = 30;

export default function ResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const [result, setResult] = useState<{
    score: number;
    totalQuestions: number;
  } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_RETURN_SECONDS);

  useEffect(() => {
    fetch(`/api/student/attempts/${attemptId}`)
      .then((r) => r.json())
      .then((data) =>
        setResult({ score: data.score, totalQuestions: data.totalQuestions })
      );
  }, [attemptId]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      router.push("/dashboard/student");
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <p className="font-display text-lg text-ink">თქვენი</p>
        <p className="font-display text-lg text-ink mb-4">შედეგი</p>
        <p className="text-4xl font-display text-marker mb-8">
          {result ? `${result.score} / ${result.totalQuestions}` : "…"}
        </p>

        <div className="border-t border-paper-line pt-6 mb-6">
          <Link
            href={`/dashboard/student/results/${attemptId}/review`}
            className="inline-block rounded-full border-2 border-marker text-marker
                       font-medium px-6 py-2 hover:bg-marker hover:text-white transition-colors"
          >
            იხილეთ განხილვა ↓
          </Link>
        </div>

        <div className="border-t border-paper-line pt-6">
          <Link href="/dashboard/student" className="text-ink-soft hover:text-ink">
            მთავარ გვერდზე დაბრუნება
          </Link>
        </div>

        <p className="text-xs text-ink-soft mt-8">
          <span className="text-ink-soft">countdown</span>{" "}
          <span className="text-marker">{secondsLeft} წ.</span>
        </p>
      </div>
    </main>
  );
}
