"use client";

import { useCallback, useEffect, useState } from "react";
import HScrollText from "@/components/h-scroll-text";
import ConfirmDialog from "@/components/confirm-dialog";
import VScrollBox from "@/components/v-scroll-box";

type Item = { id: string; sentAt: string; title: string; target: string };

function ymd(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function NewSentTests({
  endpoint,
  refreshKey = 0,
}: {
  endpoint: string;
  refreshKey?: number;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState<Item | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.items ?? []);
      setError("");
    } catch {
      setError("სიის ჩატვირთვა ვერ მოხერხდა.");
    }
  }, [endpoint]);

  useEffect(() => {
    if (open) load();
  }, [open, refreshKey, load]);

  async function confirmDelete() {
    if (!toDelete) return;
    const id = toDelete.id;
    setToDelete(null);
    const res = await fetch(endpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "წაშლა ვერ მოხერხდა.");
      load();
      return;
    }
    setError("");
    setItems((prev) => prev?.filter((i) => i.id !== id) ?? prev);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="-mx-4 rounded-full border-2 border-marker text-marker font-body
                   font-medium py-2.5 transition-colors hover:bg-paper"
      >
        ახლად გაგზავნილი ტესტები
      </button>

      {open && (
        <div className="-mx-4 bg-white border border-paper-line rounded-md overflow-hidden">
          {error && (
            <p className="px-3 py-3 text-sm text-marker-dark text-center">{error}</p>
          )}

          {items && items.length === 0 && !error && (
            <p className="px-3 py-3 text-sm text-ink-soft text-center">
              ახლად გაგზავნილი ტესტები არ არის
            </p>
          )}

          {items && items.length > 0 && (
            <VScrollBox drag={false} className="max-h-72">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 px-2 py-2.5 text-xs text-ink
                             border-b border-paper-line last:border-b-0"
                >
                  <span className="shrink-0 text-ink-soft">{ymd(item.sentAt)}</span>
                  <span className="text-paper-line">|</span>
                  <HScrollText className="flex-1 min-w-0">{item.title}</HScrollText>
                  <span className="text-paper-line">|</span>
                  <HScrollText className="flex-1 min-w-0">{item.target}</HScrollText>
                  <span className="text-paper-line">|</span>
                  <button
                    type="button"
                    onClick={() => setToDelete(item)}
                    className="shrink-0 px-1 text-ink-soft hover:text-marker-dark"
                    aria-label="წაშლა"
                  >
                    ×
                  </button>
                </div>
              ))}
            </VScrollBox>
          )}
        </div>
      )}

      {toDelete && (
        <ConfirmDialog
          message={`წავშალო „${toDelete.title}“ (${toDelete.target})?`}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}