"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const AUTO_RETURN_SECONDS = 30;

function getTimeColor(secondsLeft: number, totalSeconds: number) {
  const ratio = Math.max(0, Math.min(1, secondsLeft / totalSeconds));
  const from = { r: 0xb3, g: 0x3f, b: 0x2e };
  const to = { r: 0x2e, g: 0x6b, b: 0x5e };
  const r = Math.round(from.r + (to.r - from.r) * ratio);
  const g = Math.round(from.g + (to.g - from.g) * ratio);
  const b = Math.round(from.b + (to.b - from.b) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

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

<p
  className="text-xs font-semibold mt-8"
  style={{ color: getTimeColor(secondsLeft, AUTO_RETURN_SECONDS) }}
>
  {secondsLeft}
</p>
      </div>
    </main>
  );
}
