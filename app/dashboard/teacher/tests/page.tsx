"use client";

import { useEffect, useState, useCallback } from "react";
import { ThemeRecord } from "./types";
import ThemeCard from "./theme-card";
import AddThemeModal from "./add-theme-modal";

export default function ThemesAndTestsTab() {
  const [themes, setThemes] = useState<ThemeRecord[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [addThemeOpen, setAddThemeOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/themes");
    const data = await res.json();
    setThemes(data.themes ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function renameTheme(themeId: string, name: string) {
    const res = await fetch(`/api/themes/${themeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return data?.error ?? "ვერ განახლდა";
    }
    await load();
  }

  async function deleteTheme(themeId: string) {
    const res = await fetch(`/api/themes/${themeId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return data?.error ?? "ვერ წაიშალა";
    }
    setThemes((prev) => prev?.filter((t) => t.id !== themeId) ?? prev);
  }

  function startDrag(themeId: string, e: React.PointerEvent) {
    if (!themes) return;
    e.preventDefault();
    let orderedIds = themes.map((t) => t.id);
    setDraggingId(themeId);

    function onMove(ev: PointerEvent) {
      const hit = document
        .elementFromPoint(ev.clientX, ev.clientY)
        ?.closest<HTMLElement>("[data-theme-id]");
      const overId = hit?.dataset.themeId;
      if (!overId || overId === themeId) return;

      const from = orderedIds.indexOf(themeId);
      const to = orderedIds.indexOf(overId);
      if (from === -1 || to === -1 || from === to) return;

      const next = [...orderedIds];
      next.splice(from, 1);
      next.splice(to, 0, themeId);
      orderedIds = next;

      setThemes((prev) => {
        if (!prev) return prev;
        return next.map((id) => prev.find((t) => t.id === id)!).filter(Boolean);
      });
    }

    function onUp() {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      setDraggingId(null);
      fetch("/api/themes/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  if (!themes) {
    return (
      <p className="text-ink-soft text-sm text-center py-12">იტვირთება...</p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <h2 className="font-display text-lg text-ink border-b border-paper-line pb-2">
        თემები & ტესტები
      </h2>

      {themes.length === 0 && (
        <p className="text-ink-soft text-sm text-center py-8">
          ჯერ არცერთი თემა არ გაქვთ დამატებული.
        </p>
      )}

      {themes.map((theme, i) => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          themeIndex={i}
          dragging={draggingId === theme.id}
          onHandlePointerDown={(e) => startDrag(theme.id, e)}
          onRename={(name) => renameTheme(theme.id, name)}
          onDelete={() => deleteTheme(theme.id)}
        />
      ))}

      <button
        onClick={() => setAddThemeOpen(true)}
        className="mt-2 text-[15px] text-marker font-medium text-left hover:text-marker-dark"
      >
        + თემა
      </button>

      {addThemeOpen && (
        <AddThemeModal
          onClose={() => setAddThemeOpen(false)}
          onCreated={() => {
            setAddThemeOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
