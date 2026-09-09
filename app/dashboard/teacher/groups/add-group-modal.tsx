"use client";

import { useState, FormEvent } from "react";
import Modal from "@/components/modal";

const inputClass =
  "w-full border border-paper-line rounded-sm px-3 py-2.5 font-body text-ink " +
  "focus:outline-none focus:ring-2 focus:ring-marker/40 focus:border-marker";

export default function AddGroupModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "ვერ დაემატა");
      setSaving(false);
      return;
    }

    onCreated();
  }

  return (
    <Modal title="ჯგუფის დამატება" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-ink-soft mb-2">
            ჯგუფის სახელი
          </label>
          <input
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        {error && <p className="text-sm text-marker-dark">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-marker text-white font-medium py-2.5
                     hover:bg-marker-dark transition-colors disabled:opacity-50"
        >
          {saving ? "ინახება..." : "Save"}
        </button>
      </form>
    </Modal>
  );
}
