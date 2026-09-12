"use client";

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

export default function NewTestContent() {
  const params = useSearchParams();
  const router = useRouter();
  const themeId = params.get("themeId") ?? "";
  const type = (params.get("type") ?? "type1") as TestTemplate;

  async function create(values: {
    themeId: string;
    title: string;
    instruction: string;
    questions: QuestionDraft[];
    published: boolean;
  }) {
    const res = await fetch(`/api/themes/${values.themeId}/tests`, {
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
      return data?.error ?? "ვერ შეინახა";
    }

    router.push(`/dashboard/teacher/tests/${data.test.id}`);
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
        onSave={create}
        onPublish={create}
      />
    </div>
  );
}
