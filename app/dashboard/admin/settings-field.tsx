"use client";

import { useState } from "react";

const inputClass =
  "w-full border border-paper-line rounded-sm px-3 py-2.5 font-body text-ink bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-marker/40 focus:border-marker";

type Status = "idle" | "saving" | "saved" | "error";

export default function SettingsField({
  fieldKey,
  label,
  hint,
  initialValue,
  multiline = false,
}: {
  fieldKey: string;
  label: string;
  hint?: string;
  initialValue: string;
  multiline?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function save() {
    setStatus("saving");
    setError("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [fieldKey]: value }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "ვერ შეინახა");
      setStatus("error");
      return;
    }
    setStatus("saved");
    setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 2000);
  }

  const Field = multiline ? "textarea" : "input";

  return (
    <div className="flex flex-col gap-2 pb-5 mb-5 border-b border-paper-line last:border-b-0">
      <label className="text-sm text-ink-soft">{label}</label>
      {hint && <p className="text-xs text-ink-soft/70 -mt-1">{hint}</p>}
      <Field
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          setValue(e.target.value)
        }
        rows={multiline ? 4 : undefined}
        className={inputClass}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          className="rounded-full bg-marker text-white font-body font-medium text-sm
                     px-4 py-2 transition-colors hover:bg-marker-dark
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "saving" ? "იბარდება..." : "შენახვა"}
        </button>
        {status === "saved" && (
          <span className="text-sm text-ledger">შენახულია</span>
        )}
        {status === "error" && (
          <span className="text-sm text-marker-dark">{error}</span>
        )}
      </div>
    </div>
  );
}
