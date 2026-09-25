"use client";

import { useEffect, useState, useCallback } from "react";
import { ThemeRecord } from "./types";
import ThemeCard from "./theme-card";
import AddThemeModal from "./add-theme-modal";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

export default function ThemesAndTestsTab() {
  const [themes, setThemes] = useState<ThemeRecord[] | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmTemplate, setDeleteConfirmTemplate] = useState<
    string | undefined
  >(undefined);
  const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  })
);
  const [addThemeOpen, setAddThemeOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/themes");
    const data = await res.json();
    setThemes(data.themes ?? []);
  }, []);

  useEffect(() => {
    load();
    fetch("/api/settings/texts")
      .then((r) => r.json())
      .then((data) => setDeleteConfirmTemplate(data.themeDeleteConfirmText))
      .catch(() => {});
  }, [load]);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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

function handleThemeDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!themes || !over || active.id === over.id) return;

  const ids = themes.map((t) => t.id);
  const fromIndex = ids.indexOf(active.id as string);
  const toIndex = ids.indexOf(over.id as string);
  const newIds = arrayMove(ids, fromIndex, toIndex);

  const reordered = newIds
    .map((id) => themes.find((t) => t.id === id)!)
    .filter(Boolean);
  setThemes(reordered);

  fetch("/api/themes/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds: newIds }),
  });
}

  if (!themes) {
    return (
      <p className="text-ink-soft text-sm text-center py-12">იტვირთება...</p>
    );
  }

  return (
    <div className="w-screen relative left-1/2 -ml-[50vw] px-[2.5vw]">
    <div className="flex flex-col gap-2.5">
      <h2 className="font-display text-lg text-ink border-b border-paper-line pb-2">
        თემები & ტესტები
      </h2>

      {themes.length === 0 && (
        <p className="text-ink-soft text-sm text-center py-8">
          ჯერ არცერთი თემა არ გაქვთ დამატებული.
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleThemeDragEnd}
      >
        <SortableContext
          items={themes.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {themes.map((theme, i) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              themeIndex={i}
              expanded={expandedIds.has(theme.id)}
              onToggleExpand={() => toggleExpand(theme.id)}
              onRename={(name) => renameTheme(theme.id, name)}
              onDelete={() => deleteTheme(theme.id)}
              deleteConfirmTemplate={deleteConfirmTemplate}
            />
          ))}
        </SortableContext>
      </DndContext>

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
    </div>
  );
}
