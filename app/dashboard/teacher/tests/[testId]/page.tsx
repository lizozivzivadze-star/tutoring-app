"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TestForm from "../test-form";
import { QuestionDraft, TestDetail, TYPE_LABELS } from "../types";
import ConfirmDialog from "@/components/confirm-dialog";

function toDrafts(test: TestDetail): QuestionDraft[] {
  return test.questions.map((q) => ({
    id: q.id,
    clientId: q.id,
    prompt: q.prompt,
    options: q.options.map((o) => ({
      id: o.id,
      clientId: o.id,
      text: o.text,
      isCorrect: o.isCorrect,
    })),
  }));
}

function toApiQuestions(questions: QuestionDraft[]) {
  return questions.map((q) => ({
    prompt: q.prompt,
    options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
  }));
}

export default function TestDetailPage() {
  const { testId } = useParams<{ testId: string }>();
  const router = useRouter();
  const [test, setTest] = useState<TestDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/tests/${testId}`);
    if (!res.ok) {
      setNotFound(true);
      return;
    }
    const data = await res.json();
    setTest(data.test);
  }, [testId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(values: {
    themeId: string;
    title: string;
    instruction: string;
    questions: QuestionDraft[];
    published: boolean;
  }) {
    const res = await fetch(`/api/tests/${testId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        themeId: values.themeId,
        title: values.title,
        instruction: values.instruction,
        published: values.published,
        // Locked tests keep their questions server-side no matter
        // what — but we still avoid sending a payload that would be
        // rejected outright, so the rest of the save (title etc.)
        // doesn't fail alongside it.
        ...(test?.locked ? {} : { questions: toApiQuestions(values.questions) }),
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return data?.error ?? "ვერ განახლდა";
    }

    setTest({ ...data.test, locked: test?.locked ?? false });
    setEditing(false);
  }

  async function togglePublished() {
    if (!test) return;
    setToggling(true);
    setToggleError("");

    const res = await fetch(`/api/tests/${testId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        themeId: test.themeId,
        title: test.title,
        instruction: test.instruction,
        published: !test.published,
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setToggleError(data?.error ?? "ვერ განახლდა");
      setToggling(false);
      return;
    }

    setTest({ ...test, published: data.test.published });
    setToggling(false);
  }

  async function handleDelete() {
    const res = await fetch(`/api/tests/${testId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setDeleteError(data?.error ?? "ვერ წაიშალა");
      setConfirmingDelete(false);
      return;
    }
    router.push("/dashboard/teacher/tests");
  }

  if (notFound) {
    return (
      <p className="text-sm text-marker-dark text-center py-12">
        ტესტი ვერ მოიძებნა.{" "}
        <Link href="/dashboard/teacher/tests" className="text-marker font-medium">
          უკან
        </Link>
      </p>
    );
  }

  if (!test) {
    return (
      <p className="text-ink-soft text-sm text-center py-12">იტვირთება...</p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Link
          href="/dashboard/teacher/tests"
          className="text-sm text-marker font-medium"
        >
          ← უკან
        </Link>
        {!editing && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-marker font-medium"
            >
              edit
            </button>
            {!test.locked && (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="text-sm text-ink-soft hover:text-marker-dark"
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <TestForm
          initialThemeId={test.themeId}
          type={test.type}
          initialTitle={test.title}
          initialInstruction={test.instruction ?? ""}
          initialPublished={test.published}
          initialQuestions={toDrafts(test)}
          locked={test.locked}
          onSave={save}
          onPublish={(v) => save({ ...v, published: true })}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="font-display text-lg text-ink">{test.title}</h1>
              <button
                onClick={togglePublished}
                disabled={toggling}
                className={`text-xs px-2 py-0.5 rounded-full transition-opacity disabled:opacity-50 ${
                  test.published
                    ? "bg-ledger-soft text-ledger"
                    : "bg-paper-line/60 text-ink-soft"
                }`}
                title={test.published ? "დააჭირეთ გასაუქმებლად" : "დააჭირეთ გამოსაქვეყნებლად"}
              >
                {toggling
                  ? "..."
                  : test.published
                  ? "published (unpublish)"
                  : "unpublished (publish)"}
              </button>
              {test.locked && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-paper-line/60 text-ink-soft">
                  გაგზავნილი — ჩაკეტილი
                </span>
              )}
            </div>
            {toggleError && (
              <p className="text-xs text-marker-dark mb-1">{toggleError}</p>
            )}
            <p className="text-xs text-ink-soft">{TYPE_LABELS[test.type]}</p>
            {test.instruction && (
              <p className="text-sm text-ink-soft mt-2">{test.instruction}</p>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-paper-line pt-4">
            {test.questions.map((q, i) => (
              <div
                key={q.id}
                className="border border-paper-line rounded-sm p-3 bg-paper"
              >
                <p className="text-sm text-ink mb-2">
                  <span className="text-ink-soft">შ{i + 1}.</span> {q.prompt}
                </p>
                <div className="flex flex-col gap-1 pl-5">
                  {q.options.map((o, oi) => (
                    <p
                      key={o.id}
                      className={`text-sm ${
                        o.isCorrect ? "text-ledger font-medium" : "text-ink-soft"
                      }`}
                    >
                      პ{oi + 1}. {o.text}
                      {o.isCorrect && " ✓"}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {deleteError && (
        <p className="text-sm text-marker-dark mt-3">{deleteError}</p>
      )}

      {confirmingDelete && (
        <ConfirmDialog
          message={`დარწმუნებული ხარ, რომ გინდა „${test.title}“-ის წაშლა?`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
