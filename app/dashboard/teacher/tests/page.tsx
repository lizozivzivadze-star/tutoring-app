"use client";

import { useEffect, useState, useCallback } from "react";
import { ThemeRecord } from "./types";
import ThemeCard from "./theme-card";
import AddThemeModal from "./add-theme-modal";

export default function ThemesAndTestsTab() {
  const [themes, setThemes] = useState<ThemeRecord[] | null>(null);
  const [dragThemeId, setDragThemeId] = useState<string | null>(null);
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

  function handleDrop(targetId: string) {
    if (!themes || !dragThemeId || dragThemeId === targetId) return;
    const ids = themes.map((t) => t.id);
    const fromIndex = ids.indexOf(dragThemeId);
    const toIndex = ids.indexOf(targetId);
    ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, dragThemeId);

    const reordered = ids
      .map((id) => themes.find((t) => t.id === id)!)
      .filter(Boolean);
    setThemes(reordered);
    setDragThemeId(null);

    fetch("/api/themes/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: ids }),
    });
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
          draggable
          onDragStart={() => setDragThemeId(theme.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(theme.id)}
          onRename={(name) => renameTheme(theme.id, name)}
          onDelete={() => deleteTheme(theme.id)}
        />
      ))}

      <button
        onClick={() => setAddThemeOpen(true)}
        className="mt-2 text-sm text-marker font-medium text-left hover:text-marker-dark"
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
