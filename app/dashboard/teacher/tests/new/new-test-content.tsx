"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import TestForm from "../test-form";
import { QuestionDraft, TestTemplate } from "../types";

function toApiQuestions(questions: QuestionDraft[]) {
  return questions.map((q) => ({
    prompt: q.prompt,
    options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
  }));
}

type FormValues = {
  themeId: string;
  title: string;
  instruction: string;
  questions: QuestionDraft[];
  published: boolean;
};

export default function NewTestContent() {
  const params = useSearchParams();
  const router = useRouter();
  const themeId = params.get("themeId") ?? "";
  const type = (params.get("type") ?? "type1") as TestTemplate;

  // Once the first Save creates the row, we keep its id here and
  // switch to PATCH — otherwise every subsequent Save would create
  // another test instead of updating the draft in progress.
  const [savedTestId, setSavedTestId] = useState<string | null>(null);

  async function persist(
    values: FormValues
  ): Promise<{ id: string } | { error: string }> {
    const res = savedTestId
      ? await fetch(`/api/tests/${savedTestId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            themeId: values.themeId,
            title: values.title,
            instruction: values.instruction,
            published: values.published,
            questions: toApiQuestions(values.questions),
          }),
        })
      : await fetch(`/api/themes/${values.themeId}/tests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            title: values.title,
            instruction: values.instruction,
            published: values.published,
            questions: toApiQuestions(values.questions),
          }),
        });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { error: data?.error ?? "ვერ შეინახა" };
    }

    setSavedTestId(data.test.id);
    return { id: data.test.id as string };
  }

  // Save: keeps the current (possibly unfinished) state, stays on
  // this screen — no navigation.
  async function handleSave(values: FormValues) {
    const result = await persist(values);
    if ("error" in result) return result.error;
  }

  // Publish: marks it published and moves on to the test's admin
  // page, since publishing is the "this is done, manage it" action.
  async function handlePublish(values: FormValues) {
    const result = await persist({ ...values, published: true });
    if ("error" in result) return result.error;
    router.push(`/dashboard/teacher/tests/${result.id}`);
  }

  if (!themeId) {
    return (
      <p className="text-sm text-marker-dark text-center py-12">
        თემა არ არის მითითებული.{" "}
        <Link href="/dashboard/teacher/tests" className="text-marker font-medium">
          უკან
        </Link>
      </p>
    );
  }

  return (
    <div>
      <Link
        href="/dashboard/teacher/tests"
        className="text-sm text-marker font-medium"
      >
        ← უკან
      </Link>
      <h1 className="font-display text-xl font-medium text-ink mt-3 mb-5 pb-2 border-b border-paper-line">
        ახალი ტესტი
      </h1>

      <TestForm
        initialThemeId={themeId}
        type={type}
        onSave={handleSave}
        onPublish={handlePublish}
      />
    </div>
  );
}