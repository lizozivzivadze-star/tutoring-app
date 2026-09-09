"use client";

import { useState, FormEvent } from "react";
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
}: {
  title: string;
  initial?: Partial<StudentRecord>;
  onClose: () => void;
  onSubmit: (values: {
    name: string;
    surname: string;
    contact: string;
    email: string;
  }) => Promise<string | void>; // returns an error message, or nothing on success
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [surname, setSurname] = useState(initial?.surname ?? "");
  const [contact, setContact] = useState(initial?.contact ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const result = await onSubmit({ name, surname, contact, email });
    if (result) {
      setError(result);
      setSaving(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-ink-soft mb-2">სახელი</label>
          <input
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm text-ink-soft mb-2">გვარი</label>
          <input
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm text-ink-soft mb-2">მობილური</label>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm text-ink-soft mb-2">email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
