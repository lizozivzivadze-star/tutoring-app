"use client";

import { useEffect, useState, useCallback } from "react";
import { ThemeRecord } from "./types";
import ThemeCard from "./theme-card";
import AddThemeModal from "./add-theme-modal";
import TestUsageDialog from "./test-usage-dialog";
import { TestsStats } from "@/components/stats-block";
import LoadingBar from "@/components/loading-bar";
import Link from "next/link";
import UiIcon from "@/components/ui-icon";
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

  const [addThemeOpen, setAddThemeOpen] = useState(false);
  // „ტესტები #": რამდენჯერ გაკეთდა თითოეული ტესტი + გახსნილი ანგარიში
  const [usageCounts, setUsageCounts] = useState<Record<string, number> | null>(null);
  const [usageTestId, setUsageTestId] = useState<string | null>(null);

  // 6-წერტილიანი სახელურით გადაადგილება (იგივე, რაც ჯგუფებში)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleThemeDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!themes || !over || active.id === over.id) return;

    const ids = themes.map((t) => t.id);
    const newIds = arrayMove(
      ids,
      ids.indexOf(active.id as string),
      ids.indexOf(over.id as string)
    );
    setThemes(newIds.map((id) => themes.find((t) => t.id === id)!));

    fetch("/api/themes/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: newIds }),
    });
  }

  // ტესტების რიგი ერთი თემის ერთი ტიპის შიგნით
  function reorderTests(themeId: string, orderedIds: string[]) {
    setThemes((prev) =>
      prev?.map((theme) =>
        theme.id !== themeId
          ? theme
          : {
              ...theme,
              tests: theme.tests.map((t) => {
                const i = orderedIds.indexOf(t.id);
                return i === -1 ? t : { ...t, order: i };
              }),
            }
      ) ?? prev
    );

    fetch("/api/tests/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    });
  }

  const load = useCallback(async () => {
    const res = await fetch("/api/themes");
    const data = await res.json();
    setThemes(data.themes ?? []);
  }, []);

  useEffect(() => {
    load();
    fetch("/api/tester/test-usage", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setUsageCounts(data.counts ?? {}))
      .catch(() => {});
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



  if (!themes) {
    return (
      <LoadingBar />
    );
  }

  // სტატისტიკა: ზუსტად ის, რაც ქვემოთ სიაში ჩანს (ყველა ტესტი, დრაფტებითაც)
  const shownTests = themes.flatMap((th) => th.tests);
  const shownQuestions = shownTests.reduce(
    (sum, t) => sum + (t._count?.questions ?? 0),
    0
  );

  return (
    <div>
    <div className="mb-5">
      <TestsStats tests={shownTests.length} questions={shownQuestions} />
    </div>
    <div className="flex flex-col gap-2.5">
      <div className="border-b border-paper-line pb-[5px] -mb-[5px]">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-body text-[17.5px] font-medium text-ink">
            თემები & ტესტები
          </h2>
          <Link
            href="/dashboard/tester/tests/new"
            className="shrink-0 text-base text-marker font-medium hover:text-marker-hover"
          >
            <UiIcon name="plus" /> ტესტი
          </Link>
        </div>
      </div>

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
              onReorderTests={(ids) => reorderTests(theme.id, ids)}
              deleteConfirmTemplate={deleteConfirmTemplate}
              usageCounts={usageCounts}
              onOpenUsage={setUsageTestId}
            />
          ))}
        </SortableContext>
      </DndContext>


      <button
        onClick={() => setAddThemeOpen(true)}
        className="mt-2 text-base text-marker font-medium text-left hover:text-marker-hover"
      >
        <UiIcon name="plus" /> თემა
      </button>

      {usageTestId && (
        <TestUsageDialog
          testId={usageTestId}
          onClose={() => setUsageTestId(null)}
        />
      )}

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
