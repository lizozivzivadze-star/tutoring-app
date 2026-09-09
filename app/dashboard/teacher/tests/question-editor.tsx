"use client";

import { QuestionDraft, OptionDraft } from "./types";

function makeOption(): OptionDraft {
  return {
    clientId: crypto.randomUUID(),
    text: "",
    isCorrect: false,
  };
}

export function newQuestion(): QuestionDraft {
  return {
    clientId: crypto.randomUUID(),
    prompt: "",
    options: [makeOption(), makeOption()],
  };
}

export default function QuestionEditor({
  question,
  index,
  onChange,
  onRemove,
  removable,
}: {
  question: QuestionDraft;
  index: number;
  onChange: (q: QuestionDraft) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  function updateOption(clientId: string, patch: Partial<OptionDraft>) {
    onChange({
      ...question,
      options: question.options.map((o) =>
        o.clientId === clientId ? { ...o, ...patch } : o
      ),
    });
  }

  function setCorrect(clientId: string) {
    onChange({
      ...question,
      options: question.options.map((o) => ({
        ...o,
        isCorrect: o.clientId === clientId,
      })),
    });
  }

  function addOption() {
    if (question.options.length >= 6) return;
    onChange({ ...question, options: [...question.options, makeOption()] });
  }

  function removeOption(clientId: string) {
    if (question.options.length <= 2) return;
    onChange({
      ...question,
      options: question.options.filter((o) => o.clientId !== clientId),
    });
  }

  return (
    <div className="border border-paper-line rounded-sm p-3 bg-paper">
      <div className="flex items-start gap-2 mb-3">
        <span className="text-sm text-ink-soft shrink-0 pt-2.5">
          შ{index + 1}
        </span>
        <input
          value={question.prompt}
          onChange={(e) => onChange({ ...question, prompt: e.target.value })}
          placeholder="კითხვის ტექსტი"
          className="flex-1 border border-paper-line rounded-sm px-3 py-2
                     bg-white text-ink focus:outline-none focus:ring-2
                     focus:ring-marker/40 focus:border-marker"
        />
        {removable && (
          <button
            onClick={onRemove}
            className="text-xs text-ink-soft hover:text-marker-dark px-1 pt-2.5"
          >
            ×
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2 pl-7">
        {question.options.map((option, oIndex) => (
          <div key={option.clientId} className="flex items-center gap-2">
            <input
              type="radio"
              name={`correct-${question.clientId}`}
              checked={option.isCorrect}
              onChange={() => setCorrect(option.clientId)}
              className="accent-ledger shrink-0"
              title="სწორი პასუხი"
            />
            <span className="text-xs text-ink-soft w-6 shrink-0">
              პ{oIndex + 1}
            </span>
            <input
              value={option.text}
              onChange={(e) =>
                updateOption(option.clientId, { text: e.target.value })
              }
              placeholder={`პასუხი ${oIndex + 1}`}
              className="flex-1 border border-paper-line rounded-sm px-3 py-1.5
                         bg-white text-ink text-sm focus:outline-none focus:ring-2
                         focus:ring-marker/40 focus:border-marker"
            />
            {question.options.length > 2 && (
              <button
                onClick={() => removeOption(option.clientId)}
                className="text-xs text-ink-soft hover:text-marker-dark px-1"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {question.options.length < 6 && (
          <button
            onClick={addOption}
            className="text-xs text-marker font-medium text-left mt-1"
          >
            + პასუხის დამატება
          </button>
        )}
      </div>
    </div>
  );
}
