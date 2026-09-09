"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { QUESTION_TIME_SECONDS } from "@/lib/test-taking";

type Option = { id: string; text: string };
type Question = { id: string; prompt: string; options: Option[] };
type TestData = {
  sentTestId: string;
  title: string;
  instruction: string | null;
  questions: Question[];
};

type Stage = "loading" | "instructions" | "question" | "submitting" | "error" | "already-done";

export default function TakeTestPage() {
  const { sentTestId } = useParams<{ sentTestId: string }>();
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("loading");
  const [test, setTest] = useState<TestData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_TIME_SECONDS);
  const answersRef = useRef<{ questionId: string; selectedOptionId: string | null }[]>([]);

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
    async (finalAnswers: { questionId: string; selectedOptionId: string | null }[]) => {
      setStage("submitting");
      const res = await fetch("/api/student/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentTestId, answers: finalAnswers }),
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
    answersRef.current = [
      ...answersRef.current,
      { questionId: question.id, selectedOptionId: selected },
    ];

    const nextIndex = questionIndex + 1;
    if (nextIndex >= test.questions.length) {
      submit(answersRef.current);
      return;
    }
    setQuestionIndex(nextIndex);
    setSelected(null);
    setSecondsLeft(QUESTION_TIME_SECONDS);
  }, [test, questionIndex, selected, submit]);

  // Countdown for the active question — auto-advances at 0.
  useEffect(() => {
    if (stage !== "question") return;
    if (secondsLeft <= 0) {
      confirmAndAdvance();
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, secondsLeft]);

  if (stage === "loading" || stage === "already-done") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-ink-soft text-sm">იტვირთება...</p>
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
    const optionCounts = new Set(test.questions.map((q) => q.options.length));
    const optionsLabel =
      optionCounts.size === 1
        ? `${[...optionCounts][0]}`
        : `${Math.min(...optionCounts)}-${Math.max(...optionCounts)}`;

    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-lg text-ink border-b border-paper-line pb-2 mb-4">
            ინსტრუქცია
          </h1>
          <ul className="flex flex-col gap-2 text-ink text-sm mb-8">
            <li>• სულ არის {test.questions.length} შეკითხვა</li>
            <li>• თითოს აქვს {optionsLabel} პასუხის ალტერნატივა</li>
            <li>• მხოლოდ 1 არის სწორი</li>
            <li>• თითოს დრო {QUESTION_TIME_SECONDS} წმ</li>
            <li>• მონიშნავთ</li>
            <li>• დაადასტურებთ & გადახვალთ</li>
          </ul>
          {test.instruction && (
            <p className="text-sm text-ink-soft mb-6">{test.instruction}</p>
          )}
          <button
            onClick={() => setStage("question")}
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
        <p className="text-sm text-ink-soft mb-1">ტესტი: {test.title}</p>
        <p className="text-sm text-ink-soft mb-6">
          შეკითხვა #{questionIndex + 1} - {test.questions.length}
        </p>

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
                  : "border-paper-line bg-paper hover:border-ink-soft"
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
          <button
            onClick={confirmAndAdvance}
            className="rounded-full bg-marker text-white font-medium px-8 py-2.5
                       hover:bg-marker-dark transition-colors"
          >
            ვადასტურებ
          </button>
          <p className="text-sm text-ink-soft">
            countdown {secondsLeft} წ ↓
          </p>
        </div>
      </div>
    </main>
  );
}
