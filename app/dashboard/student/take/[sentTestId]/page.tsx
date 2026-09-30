"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { QUESTION_TIME_SECONDS } from "@/lib/test-taking";
import LoadingBar from "@/components/loading-bar";
import { formatDuration } from "@/lib/format-time";

type Option = { id: string; text: string };
type Question = { id: string; prompt: string; options: Option[] };
type TestData = {
  sentTestId: string;
  title: string;
  instruction: string | null;
  timerEnabled: boolean;
  allowBack: boolean;
  questions: Question[];
};

type Answer = { questionId: string; selectedOptionId: string | null };

type Stage = "loading" | "instructions" | "question" | "submitting" | "error" | "already-done";

function getTimeColor(secondsLeft: number, totalSeconds: number) {
  const ratio = Math.max(0, Math.min(1, secondsLeft / totalSeconds));
    // წითელი (#dc2626) → მწვანე (--color-ledger: #16a34a)
  const from = { r: 0xdc, g: 0x26, b: 0x26 };
  const to = { r: 0x16, g: 0xa3, b: 0x4a };
  const r = Math.round(from.r + (to.r - from.r) * ratio);
  const g = Math.round(from.g + (to.g - from.g) * ratio);
  const b = Math.round(from.b + (to.b - from.b) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function TakeTestPage() {
  const { sentTestId } = useParams<{ sentTestId: string }>();
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("loading");
  const [test, setTest] = useState<TestData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_TIME_SECONDS);
  const [elapsed, setElapsed] = useState(0);
  const answersRef = useRef<Answer[]>([]);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    fetch(`/api/student/sent-tests/${sentTestId}`)
      .then(async (r) => {
        if (r.status === 409) {
          const data = await r.json();
          router.replace(`/dashboard/student/results/${data.attemptId}`);
          return null;
        }
        if (!r.ok) {
          setErrorMessage("ტესტი ვერ მოიძებნა.");
          setStage("error");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setTest(data);
        setStage("instructions");
      });
  }, [sentTestId, router]);

  const submit = useCallback(
    async (finalAnswers: Answer[]) => {
      setStage("submitting");
      const durationSeconds = startedAtRef.current
        ? Math.round((Date.now() - startedAtRef.current) / 1000)
        : null;
      const res = await fetch("/api/student/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentTestId, answers: finalAnswers, durationSeconds }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErrorMessage(data?.error ?? "ვერ გაიგზავნა.");
        setStage("error");
        return;
      }
      router.push(`/dashboard/student/results/${data.attempt.id}`);
    },
    [sentTestId, router]
  );

  const confirmAndAdvance = useCallback(() => {
    if (!test) return;
    const question = test.questions[questionIndex];
    const updated = [...answersRef.current];
    updated[questionIndex] = { questionId: question.id, selectedOptionId: selected };
    answersRef.current = updated;

    const nextIndex = questionIndex + 1;
    if (nextIndex >= test.questions.length) {
      submit(answersRef.current);
      return;
    }
    setQuestionIndex(nextIndex);
    setSelected(answersRef.current[nextIndex]?.selectedOptionId ?? null);
    setSecondsLeft(QUESTION_TIME_SECONDS);
  }, [test, questionIndex, selected, submit]);

  const goBack = useCallback(() => {
    if (!test || questionIndex === 0) return;
    const updated = [...answersRef.current];
    updated[questionIndex] = {
      questionId: test.questions[questionIndex].id,
      selectedOptionId: selected,
    };
    answersRef.current = updated;
    const prev = questionIndex - 1;
    setQuestionIndex(prev);
    setSelected(updated[prev]?.selectedOptionId ?? null);
  }, [test, questionIndex, selected]);

  // Countdown for the active question — auto-advances at 0.
  // მხოლოდ მაშინ, როცა წამზომი ჩართულია.
  useEffect(() => {
    if (stage !== "question" || !test?.timerEnabled) return;
    if (secondsLeft <= 0) {
      confirmAndAdvance();
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, secondsLeft, test]);

  // წამზომი გამორთვისას: ტესტის გავლის საერთო დროის ათვლა.
  useEffect(() => {
    if (stage !== "question" || !test || test.timerEnabled) return;
    const id = setInterval(() => {
      if (startedAtRef.current) {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [stage, test]);

  if (stage === "loading" || stage === "already-done") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingBar />
      </main>
    );
  }

  if (stage === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <p className="text-sm text-marker-dark text-center">{errorMessage}</p>
      </main>
    );
  }

  if (!test) return null;

  if (stage === "instructions") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
<h1 className="font-display text-lg text-ink border-b border-paper-line pb-2 mb-4 text-center">
  ინსტრუქცია
</h1>
          {test.instruction && (
  <p className="text-sm text-ink-soft mb-6 text-center">{test.instruction}</p>
)}
          <button
            onClick={() => {
              startedAtRef.current = Date.now();
              setStage("question");
            }}
            className="w-full rounded-full bg-marker text-white font-medium py-3
                       hover:bg-marker-dark transition-colors"
          >
            დაწყება
          </button>
        </div>
      </main>
    );
  }

  if (stage === "submitting") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-ink-soft text-sm">იგზავნება...</p>
      </main>
    );
  }

  const question = test.questions[questionIndex];

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="max-w-sm mx-auto">
<div className="border-[2.5px] border-paper-line rounded-md bg-paper px-4 py-3 mb-6">
  <p className="text-sm text-ink-soft mb-1">ტესტი: {test.title}</p>
  <p className="text-sm text-ink-soft">
    შეკითხვა #{questionIndex + 1} - {test.questions.length}
  </p>
</div>

        <div className="border border-paper-line rounded-md bg-white px-4 py-4 mb-4">
          <p className="text-ink">{question.prompt}</p>
        </div>

        <div className="flex flex-col gap-2 mb-6">
          {question.options.map((option, i) => (
            <label
              key={option.id}
              className={`flex items-center gap-3 border rounded-sm px-4 py-3 cursor-pointer transition-colors ${
                selected === option.id
                  ? "border-marker bg-white"
                  : "border-paper-line bg-white hover:border-ink-soft"
              }`}
            >
              <span className="text-ink-soft text-sm w-4">{i + 1}</span>
              <input
                type="radio"
                name="answer"
                checked={selected === option.id}
                onChange={() => setSelected(option.id)}
                className="accent-marker"
              />
              <span className="text-ink text-sm">{option.text}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between">
<div className="flex items-center gap-2">
  {test.allowBack && !test.timerEnabled && questionIndex > 0 && (
    <button
      onClick={goBack}
      className="rounded-full border-2 border-paper-line text-ink-soft
                 px-5 py-2.5 hover:border-ink-soft transition-colors"
    >
      უკან
    </button>
  )}
  <button
    onClick={confirmAndAdvance}
    className="rounded-full bg-marker text-white font-medium px-8 py-2.5
               hover:bg-marker-dark transition-colors"
  >
    {questionIndex + 1 >= test.questions.length ? "დასრულება" : "შემდეგი"}
  </button>
</div>
{test.timerEnabled ? (
  <p className="text-sm font-normal" style={{ color: getTimeColor(secondsLeft, QUESTION_TIME_SECONDS) }}>
    {secondsLeft}
  </p>
) : (
  <p className="text-sm text-ink-soft">{formatDuration(elapsed)}</p>
)}
        </div>
      </div>
    </main>
  );
}