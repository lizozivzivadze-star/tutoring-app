"use client";

import { useState, useEffect, FormEvent } from "react";
import Modal from "@/components/modal";
import { StudentRecord } from "./types";

const inputClass =
  "w-full border border-paper-line rounded-sm px-3 py-2.5 font-body text-ink " +
  "focus:outline-none focus:ring-2 focus:ring-marker/40 focus:border-marker";

export default function StudentFormModal({
  title,
  initial,
  onClose,
  onSubmit,
  searchUrl,
}: {
  title: string;
  initial?: Partial<StudentRecord>;
  searchUrl?: string;
  onClose: () => void;
  onSubmit: (values: {
    name: string;
    email: string;
  }) => Promise<string | void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
    const [suggestions, setSuggestions] = useState<
    { id: string; email: string; name: string | null; surname: string | null }[]
  >([]);
  const [picked, setPicked] = useState(false);

  useEffect(() => {
    const q = email.trim();
    if (!searchUrl || picked || q.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${searchUrl}?q=${encodeURIComponent(q)}`);
        const data = await res.json().catch(() => null);
        if (!cancelled) setSuggestions(res.ok ? data?.students ?? [] : []);
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [email, searchUrl, picked]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const result = await onSubmit({ name, email });
    if (result) {
      setError(result);
      setSaving(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose} topAligned>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-ink-soft mb-2">სახელი</label>
          <input
            autoFocus
            required
            maxLength={30}
            placeholder="30-მდე სიმბოლო"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${inputClass} placeholder:text-ink-soft/40`}
          />
        </div>
        <div>
          <label className="block text-sm text-ink-soft mb-2">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setPicked(false);
            }}
            className={inputClass}
          />
          {suggestions.length > 0 && (
            <div className="mt-1 border border-paper-line rounded-sm bg-white shadow-sm">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setEmail(s.email);
                    if (!name.trim()) setName(s.name ?? "");
                    setPicked(true);
                    setSuggestions([]);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm text-ink hover:bg-paper truncate"
                >
                  {s.email}
                </button>
              ))}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-gold text-ink font-medium py-2.5
                     hover:bg-gold-hover transition-colors disabled:opacity-50"
        >
          {saving ? "ინახება..." : "Save"}
        </button>
      </form>
    </Modal>
  );
}
