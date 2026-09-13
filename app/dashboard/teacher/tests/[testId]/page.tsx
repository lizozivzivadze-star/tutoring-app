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

  // Save: persists the current (possibly unfinished) state but stays
  // on the edit screen — it must never kick the teacher out to the
  // read-only view. Publish is the only action that exits editing,
  // since publishing is the "this is done, manage it" action (mirrors
  // the new-test flow's handleSave vs handlePublish split).
  async function save(
    values: {
      themeId: string;
      title: string;
      instruction: string;
      questions: QuestionDraft[];
      published: boolean;
    },
    options?: { exitEditing?: boolean; republish?: boolean }
  ) {
    const res = await fetch(`/api/tests/${testId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        themeId: values.themeId,
        title: values.title,
        instruction: values.instruction,
        published: values.published,
        republish: options?.republish ?? false,
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
    if (options?.exitEditing) {
      setEditing(false);
    }
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

  const snapshot = test.published ? test.publishedSnapshot : null;
  const display: {
    title: string;
    instruction: string | null;
    questions: {
      id?: string;
      prompt: string;
      options: { id?: string; text: string; isCorrect: boolean }[];
    }[];
  } = snapshot ?? {
    title: test.title,
    instruction: test.instruction,
    questions: test.questions,
  };
  const hasUnpublishedEdits =
    test.published &&
    !!test.publishedAt &&
    new Date(test.updatedAt) > new Date(test.publishedAt);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        {editing ? (
          <button
            onClick={() => setEditing(false)}
            className="text-sm text-marker font-medium"
          >
            ← უკან
          </button>
        ) : (
          <Link
            href="/dashboard/teacher/tests"
            className="text-sm text-marker font-medium"
          >
            ← უკან
          </Link>
        )}
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
          onSave={(v) => save(v)}
          onPublish={(v) =>
            save({ ...v, published: true }, { exitEditing: true, republish: true })
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {display.title}
              {/* Dimmed when the test has been Saved since its last
                  explicit Publish — the live version students see is
                  still the last-published one, this is just a "you
                  have unpublished edits" nudge, not an unpublish. */}
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  test.published
                    ? "bg-ledger-soft text-ledger"
                    : "bg-paper-line/60 text-ink-soft"
                }`}
              >
                {test.published ? "published" : "unpublished"}
              </span>
              {test.locked && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-paper-line/60 text-ink-soft">
                  გაგზავნილი — ჩაკეტილი
                </span>
              )}
            </div>
            {hasUnpublishedEdits && (
              <p className="text-xs text-ink-soft/70 mb-1">
                შენახულია ცვლილება — ჯერ არ არის თავიდან გამოქვეყნებული.
              </p>
            )}
            <p className="text-xs text-ink-soft">{TYPE_LABELS[test.type]}</p>
            {test.instruction && (
              <p className="text-sm text-ink-soft mt-2">{display.instruction}</p>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-paper-line pt-4">
            {display.questions.map((q, i) => (
              <div
                key={q.id ?? i}
                className="border border-paper-line rounded-sm p-3 bg-paper"
              >
                <p className="text-sm text-ink mb-2">
                  <span className="text-ink-soft">შ{i + 1}.</span> {q.prompt}
                </p>
                <div className="flex flex-col gap-1 pl-5">
                  {q.options.map((o, oi) => (
                    <p
                      key={o.id ?? oi}
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
