"use client";

import { useEffect, useState } from "react";
import QuestionEditor, { newQuestion } from "./question-editor";
import { QuestionDraft, TestTemplate, TYPE_LABELS } from "./types";

type ThemeOption = { id: string; name: string };

const inputClass =
  "w-full border border-paper-line rounded-sm px-3 py-2.5 font-body text-ink bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-marker/40 focus:border-marker";

export default function TestForm({
  initialThemeId,
  type,
  initialTitle = "",
  initialInstruction = "",
  initialPublished = false,
  initialQuestions,
  locked = false,
  onSave,
  onPublish,
  saveLabel = "Save",
}: {
  initialThemeId: string;
  type: TestTemplate;
  initialTitle?: string;
  initialInstruction?: string;
  initialPublished?: boolean;
  initialQuestions?: QuestionDraft[];
  locked?: boolean;
  onSave: (values: {
    themeId: string;
    title: string;
    instruction: string;
    questions: QuestionDraft[];
    published: boolean;
  }) => Promise<string | void>;
  onPublish: (values: {
    themeId: string;
    title: string;
    instruction: string;
    questions: QuestionDraft[];
    published: boolean;
  }) => Promise<string | void>;
  saveLabel?: string;
}) {
  const [themes, setThemes] = useState<ThemeOption[]>([]);
  const [themeId, setThemeId] = useState(initialThemeId);
  const [title, setTitle] = useState(initialTitle);
  const [instruction, setInstruction] = useState(initialInstruction);
  const [published, setPublished] = useState(initialPublished);
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    initialQuestions?.length ? initialQuestions : [newQuestion()]
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<"save" | "publish" | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    fetch("/api/themes")
      .then((r) => r.json())
      .then((data) =>
        setThemes((data.themes ?? []).map((t: { id: string; name: string }) => ({
          id: t.id,
          name: t.name,
        })))
      );
  }, []);

  function updateQuestion(clientId: string, q: QuestionDraft) {
    setQuestions((prev) => prev.map((p) => (p.clientId === clientId ? q : p)));
  }

  function removeQuestion(clientId: string) {
    setQuestions((prev) => prev.filter((p) => p.clientId !== clientId));
  }

  async function run(action: "save" | "publish") {
    setSaving(action);
    setError("");

    // Save never silently changes publish state — only the Publish
    // button does. This used to force published:false on every Save,
    // which would quietly unpublish an already-live test the moment
    // a teacher fixed a typo in the instructions.
    const nextPublished = action === "publish" ? true : published;
    const fn = action === "save" ? onSave : onPublish;
    const result = await fn({
      themeId,
      title,
      instruction,
      questions,
      published: nextPublished,
    });
    if (result) {
      setError(result);
    } else {
      setPublished(nextPublished);
      if (action === "save") {
        setSavedNotice(true);
      }
    }
    setSaving(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {locked && (
        <p className="text-xs text-ink-soft bg-paper border border-paper-line rounded-sm px-3 py-2">
          ეს ტესტი უკვე გაგზავნილია — კითხვები ჩაკეტილია და აღარ იცვლება.
          სათაური, ინსტრუქცია და გამოქვეყნების სტატუსი კვლავ რედაქტირებადია.
        </p>
      )}

      <div>
        <label className="block text-sm text-ink-soft mb-2">თემა</label>
        <select
          value={themeId}
          onChange={(e) => setThemeId(e.target.value)}
          className={inputClass}
        >
          {themes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-ink-soft mb-2">ტიპი</label>
        <div className="border border-paper-line rounded-sm px-3 py-2.5 text-ink-soft bg-paper">
          {TYPE_LABELS[type]}
        </div>
      </div>

      <div>
        <label className="block text-sm text-ink-soft mb-2">სათაური</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm text-ink-soft mb-2">ინსტრუქცია</label>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          rows={2}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-paper-line pt-4">
        {locked
          ? questions.map((q, i) => (
              <div
                key={q.clientId}
                className="border border-paper-line rounded-sm p-3 bg-paper"
              >
                <p className="text-sm text-ink mb-2">
                  <span className="text-ink-soft">შ{i + 1}.</span> {q.prompt}
                </p>
                <div className="flex flex-col gap-1 pl-5">
                  {q.options.map((o, oi) => (
                    <p
                      key={o.clientId}
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
            ))
          : questions.map((q, i) => (
              <QuestionEditor
                key={q.clientId}
                question={q}
                index={i}
                onChange={(next) => updateQuestion(q.clientId, next)}
                onRemove={() => removeQuestion(q.clientId)}
                removable={questions.length > 1}
              />
            ))}

        {!locked && (
          <button
            onClick={() => setQuestions((prev) => [...prev, newQuestion()])}
            className="text-sm text-marker font-medium text-left"
          >
            + კითხვის დამატება
          </button>
        )}
      </div>

      {error && <p className="text-sm text-marker-dark">{error}</p>}
      {!error && savedNotice && (
        <p className="text-sm text-ledger">შენახულია</p>
      )}

      <div className="flex gap-3 border-t border-paper-line pt-4">
        <button
          onClick={() => run("save")}
          disabled={saving !== null}
          className="flex-1 rounded-full border-2 border-marker text-marker
                     font-medium py-2.5 hover:bg-marker hover:text-white
                     transition-colors disabled:opacity-50"
        >
          {saving === "save" ? "ინახება..." : saveLabel}
        </button>
        {!published && (
          <button
            onClick={() => run("publish")}
            disabled={saving !== null}
            className="flex-1 rounded-full bg-ledger text-white font-medium py-2.5
                       hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {saving === "publish" ? "ქვეყნდება..." : "Publish"}
          </button>
        )}
      </div>
    </div>
  );
}
