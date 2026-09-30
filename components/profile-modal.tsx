"use client";

import { useState, useEffect, FormEvent } from "react";
import Modal from "@/components/modal";
import LoadingBar from "@/components/loading-bar";

const inputClass =
  "w-full border border-paper-line rounded-sm px-3 py-2.5 font-body text-ink " +
  "focus:outline-none focus:ring-2 focus:ring-marker/40 focus:border-marker";

export default function ProfileModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setName(data.profile.name);
          setSurname(data.profile.surname);
          setPhone(data.profile.phone);
          setEmail(data.profile.email);
        }
        setLoading(false);
      });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, surname, phone }),
    });

    if (!res.ok) {
      setError("ვერ შეინახა, სცადეთ ხელახლა");
      setSaving(false);
      return;
    }
    onClose();
  }

  return (
    <Modal title="პროფილი" onClose={onClose} topAligned>
      {loading ? (
        <LoadingBar className="py-4" />
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-ink-soft mb-2">სახელი</label>
            <input
              autoFocus
              required
              maxLength={30}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-ink-soft mb-2">გვარი</label>
            <input
              maxLength={30}
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-ink-soft mb-2">მობილური</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-ink-soft mb-2">Email</label>
            <input
              disabled
              value={email}
              className={`${inputClass} bg-paper-line/30 text-ink-soft cursor-not-allowed`}
            />
          </div>
          {error && <p className="text-sm text-marker-dark">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-marker text-white font-medium py-2.5
                       hover:bg-marker-dark transition-colors disabled:opacity-50"
          >
            {saving ? "ინახება..." : "შენახვა"}
          </button>
        </form>
      )}
    </Modal>
  );
}