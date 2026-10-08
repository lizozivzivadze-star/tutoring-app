"use client";

import { useEffect, useState, useCallback } from "react";
import { ThemeRecord } from "./types";
import ThemeCard from "./theme-card";
import AddThemeModal from "./add-theme-modal";
import LoadingBar from "@/components/loading-bar";
import Link from "next/link";


export default function ThemesAndTestsTab() {
  const [themes, setThemes] = useState<ThemeRecord[] | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmTemplate, setDeleteConfirmTemplate] = useState<
    string | undefined
  >(undefined);

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



  if (!themes) {
    return (
      <LoadingBar />
    );
  }

  return (
    <div className="w-screen relative left-1/2 -ml-[50vw] px-[2.5vw]">
    <div className="flex flex-col gap-2.5">
      <div className="border-b border-paper-line pb-[2px] -mb-[6px]">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-body text-[19.5px] font-medium text-ink">
            თემები & ტესტები
          </h2>
          <Link
            href="/dashboard/tester/tests/new"
            className="shrink-0 rounded-full border-2 border-marker text-marker font-body
                       font-medium text-sm px-3 py-0.5 transition-colors hover:bg-paper"
          >
            + ტესტი
          </Link>
        </div>
        <p className="text-[8px] text-ink-soft mt-0.5">
          (თემებზე და ტესტებზე მუშაობა რეკომენდებულია ლეპტოპიდან და არა
          ტელეფონიდან)
        </p>
      </div>

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
              expanded={expandedIds.has(theme.id)}
              onToggleExpand={() => toggleExpand(theme.id)}
              onRename={(name) => renameTheme(theme.id, name)}
              onDelete={() => deleteTheme(theme.id)}
              deleteConfirmTemplate={deleteConfirmTemplate}
            />
          ))}


      <button
        onClick={() => setAddThemeOpen(true)}
        className="mt-2 text-base text-marker font-medium text-left hover:text-marker-dark"
      >
        <span className="glyph-btn inline-block align-middle">+</span> თემა
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
