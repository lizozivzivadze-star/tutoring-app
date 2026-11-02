"use client";

import { useEffect, useRef, useState } from "react";
import ConfirmDialog from "@/components/confirm-dialog";
import { parseTestText, type ParsedTest } from "./parse-test-file";
import QuestionEditor, { newQuestion } from "./question-editor";
import { QuestionDraft, TestTemplate, TYPE_LABELS, TYPES } from "./types";
import DropdownSelect from "@/components/dropdown-select";
import UiIcon from "@/components/ui-icon";

type ThemeOption = { id: string; name: string };

const inputClass =
  "w-full border border-paper-line rounded-sm px-3 py-2.5 font-body text-sm text-ink bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-marker/40 focus:border-marker";

export default function TestForm({
  initialThemeId,
  type,
  initialTitle = "",
  initialInstruction = "",
  initialPublished = false,
  initialActivated = false,   // ← ახალი
  initialQuestions,
  locked = false,
  onSave,
  onPublish,
  onActivate,                 // ← ახალი
  onDeactivate,
  saveLabel = "Save",
  onTypeChange,
}: {
  initialThemeId: string;
  type: TestTemplate;
  initialTitle?: string;
  initialInstruction?: string;
  initialPublished?: boolean;
  initialActivated?: boolean;
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
  onActivate?: (values: {
    themeId: string;
    title: string;
    instruction: string;
    questions: QuestionDraft[];
    published: boolean;
  }) => Promise<string | void>;
  onDeactivate?: (values: {
    themeId: string;
    title: string;
    instruction: string;
    questions: QuestionDraft[];
    published: boolean;
  }) => Promise<string | void>;
  saveLabel?: string;
  onTypeChange?: (type: TestTemplate) => void;
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
  const [activated, setActivated] = useState(initialActivated);
  const [saving, setSaving] = useState<"save" | "publish" | "activate" | "deactivate" | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importNotice, setImportNotice] = useState("");
  const [pendingImport, setPendingImport] = useState<ParsedTest | null>(null);

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
    function applyImport(test: ParsedTest) {
    setTitle(test.title);
    setQuestions(test.questions);
    setImportErrors([]);
    setImportNotice(`ჩაიტვირთა ${test.questions.length} შეკითხვა`);
  }

  async function handlePopulate() {
    if (!file) return;
    setImportErrors([]);
    setImportNotice("");
    let text: string;
    try {
      text = await file.text();
    } catch {
      setImportErrors(["ფაილის წაკითხვა ვერ მოხერხდა, აირჩიეთ ხელახლა"]);
      return;
    }
    const result = parseTestText(text);
    if (!result.ok) {
      setImportErrors(result.errors);
      return;
    }
    const hasContent = questions.some(
      (q) => q.prompt.trim() || q.options.some((o) => o.text.trim())
    );
    if (hasContent) setPendingImport(result.test);
    else applyImport(result.test);
  }

  async function run(action: "save" | "publish" | "activate" | "deactivate") {
    setSaving(action);
    setError("");

    // Save და Deactivate გამოქვეყნების სტატუსს არ ცვლის;
    // Publish და Activate ტესტს აქვეყნებს.
    const nextPublished =
      action === "save" || action === "deactivate" ? published : true;
    const fn =
      action === "save"
        ? onSave
        : action === "publish"
        ? onPublish
        : action === "activate"
        ? onActivate
        : onDeactivate;
    const result = fn
      ? await fn({
          themeId,
          title,
          instruction,
          questions,
          published: nextPublished,
        })
      : undefined;
    if (result) {
      setError(result);
    } else {
      setPublished(nextPublished);
      if (action === "activate") setActivated(true);
      if (action === "deactivate") setActivated(false);
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
          სათაური და გამოქვეყნების სტატუსი კვლავ რედაქტირებადია.
        </p>
      )}

      <div>
        <label className="block text-sm text-ink-soft mb-2">თემა</label>
        <DropdownSelect
          value={themeId}
          onChange={setThemeId}
          options={themes.map((t) => ({ value: t.id, label: t.name }))}
        />
      </div>

      <div>
        <label className="block text-sm text-ink-soft mb-2">ტიპი</label>
        {onTypeChange ? (
          <DropdownSelect
            value={type}
            onChange={(v) => onTypeChange(v as TestTemplate)}
            options={TYPES.map((t) => ({
              value: t,
              label: TYPE_LABELS[t],
              disabled: t !== "type1",
            }))}
          />
        ) : (
          <div className="border border-paper-line rounded-sm px-3 py-2.5 text-ink-soft bg-paper">
            {TYPE_LABELS[type]}
          </div>
        )}
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
        <label className="block text-sm text-ink-soft mb-2">
          გრიფირებული სახელმძღვანელო
        </label>
        <textarea
          rows={3}
          maxLength={500}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onFocus={(e) =>
            e.currentTarget.scrollIntoView({ behavior: "smooth", block: "center" })
          }
          placeholder="მაგ.: ტესტი მომზადებულია ... გრიფირებული სახელმძღვანელოს მიხედვით"
          className={inputClass}
        />
      </div>

            {!locked && (
        <div className="border border-paper-line rounded-sm bg-paper p-3 flex flex-col gap-3">
          <p className="text-sm text-ink-soft text-center">
            ტესტის ატვირთვა ფაილიდან (.txt)
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              setImportErrors([]);
              setImportNotice("");
              e.target.value = "";
            }}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex-1 rounded-full border-2 border-marker text-marker
                         font-medium py-2.5 hover:bg-marker hover:text-white
                         transition-colors"
            >
              Browse
            </button>
            <button
              type="button"
              onClick={handlePopulate}
              disabled={!file}
              className="flex-1 rounded-full bg-gold text-ink font-medium py-2.5
                         hover:bg-gold-hover transition-colors disabled:opacity-50"
            >
              Populate
            </button>
          </div>
          {file && (
            <p className="text-xs text-ink-soft text-center truncate">{file.name}</p>
          )}
          {importErrors.length > 0 && (
            <ul className="text-sm text-danger flex flex-col gap-1">
              {importErrors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
          {importNotice && (
            <p className="text-sm text-ledger text-center">{importNotice}</p>
          )}
        </div>
      )}

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
                      {o.isCorrect && <UiIcon name="check" className="ml-1" />}
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
            <UiIcon name="plus" /> კითხვის დამატება
          </button>
        )}
      </div>

      {error && <p className="text-sm text-danger text-center">{error}</p>}
      {!error && savedNotice && (
        <p className="text-sm text-ledger text-center">შენახულია</p>
      )}

      <div className="grid grid-cols-2 gap-3 border-t border-paper-line pt-4">
        <button
          onClick={() => run("save")}
          disabled={saving !== null}
          className="rounded-full border-2 border-marker text-marker
                     font-medium py-2.5 hover:bg-marker hover:text-white
                     transition-colors disabled:opacity-50"
        >
          {saving === "save" ? "ინახება..." : saveLabel}
        </button>
        <button
          onClick={() => run("publish")}
          disabled={saving !== null}
          className="rounded-full bg-ledger text-white font-medium py-2.5
                     hover:opacity-90 transition-colors disabled:opacity-50"
        >
          {saving === "publish" ? "ქვეყნდება..." : "Publish"}
        </button>
        {onActivate && (
          <button
            onClick={() => run("activate")}
            disabled={saving !== null}
            className={`rounded-full bg-gold text-ink font-medium py-2.5
                       hover:bg-gold-hover transition-colors disabled:opacity-50 ${
                         onDeactivate ? "" : "col-span-2"
                       }`}
          >
            {saving === "activate" ? "აქტიურდება..." : "Activate"}
          </button>
        )}
        {onDeactivate && (
          <button
            onClick={() => run("deactivate")}
            disabled={saving !== null}
            className="rounded-full border-2 border-paper-line text-ink-soft
                       font-medium py-2.5 hover:bg-paper
                       transition-colors disabled:opacity-50"
          >
            {saving === "deactivate" ? "ითიშება..." : "Deactivate"}
          </button>
        )}
      </div>
            {pendingImport && (
        <ConfirmDialog
          message="ახლანდელი სათაური და შეკითხვები ჩანაცვლდება ფაილის შიგთავსით"
          onConfirm={() => {
            applyImport(pendingImport);
            setPendingImport(null);
          }}
          onCancel={() => setPendingImport(null)}
        />
      )}
    </div>
  );
}
