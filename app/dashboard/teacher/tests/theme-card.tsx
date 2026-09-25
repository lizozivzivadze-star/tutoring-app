"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeRecord, TYPES, TYPE_LABELS } from "./types";
import ConfirmDialog from "@/components/confirm-dialog";
import { fillTemplate } from "@/lib/template";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import HScrollText from "@/components/h-scroll-text";

const DEFAULT_DELETE_CONFIRM =
  "დარწმუნებული ხარ, რომ გინდა „{name}“-ის წაშლა? წაიშლება მასში არსებული ყველა ტესტიც.";

export default function ThemeCard({
  theme,
  themeIndex,
  onRename,
  onDelete,
  deleteConfirmTemplate = DEFAULT_DELETE_CONFIRM,
}: {
  theme: ThemeRecord;
  themeIndex: number;
  onRename: (name: string) => Promise<string | void>;
  onDelete: () => Promise<string | void>;
  // Admin-edited text (Settings.themeDeleteConfirmText), passed down
  // from the tests tab so it's only fetched once per page, not once
  // per theme card. Falls back to the original hardcoded wording
  // until that fetch resolves.
  deleteConfirmTemplate?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(theme.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [renameError, setRenameError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
} = useSortable({ id: theme.id });

const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.5 : 1,
};

  async function saveRename() {
    if (!draftName.trim() || draftName === theme.name) {
      setEditing(false);
      setDraftName(theme.name);
      return;
    }
    const error = await onRename(draftName.trim());
    if (error) {
      setRenameError(error);
      return;
    }
    setEditing(false);
  }

  return (
<div
  ref={setNodeRef}
  style={style}
  className="border border-paper-line rounded-md bg-white px-4 py-3"
>
      <div className="flex items-center gap-2">
        <span
  {...attributes}
  {...listeners}
  style={{ touchAction: "none" }}
  className="cursor-grab text-ink-soft/60 select-none px-1 -ml-1 text-[18px]"
  title="გადაადგილება"
>
  ⠿
</span>
        {editing ? (
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={saveRename}
            onKeyDown={(e) => e.key === "Enter" && saveRename()}
            className="flex-1 border border-marker rounded-sm px-2 py-1 text-ink
                       focus:outline-none"
          />
        ) : (
          <HScrollText className="flex-1 font-display font-medium text-ink">
            {themeIndex + 1}. {theme.name}
          </HScrollText>
        )}

        <button
          onClick={() => setEditing(true)}
          className="text-[13px] text-ink-soft hover:text-marker px-1"
        >
          edit
        </button>
        <button
          onClick={() => setConfirmingDelete(true)}
          className="text-xs text-ink-soft hover:text-marker-dark px-1"
        >
          ×
        </button>
      </div>

      {renameError && (
        <p className="mt-1 pl-6 text-xs text-marker-dark">{renameError}</p>
      )}
      {deleteError && (
        <p className="mt-1 pl-6 text-xs text-marker-dark">{deleteError}</p>
      )}

      <div className="mt-2 pl-6 flex flex-col gap-1.5">
        {TYPES.map((type, typeIndex) => {
          const tests = theme.tests
            .filter((t) => t.type === type)
            .sort((a, b) => a.order - b.order);
          const templateReady = type === "type1";

          return (
            <div key={type} className="text-sm">
              <span className="text-ink-soft">{TYPE_LABELS[type]}:</span>
              <div className="flex flex-col items-start gap-1 mt-1 pl-3">
                {tests.map((test, testIndex) => {
                  const hasUnpublishedEdits =
                    test.published &&
                    !!test.publishedAt &&
                    new Date(test.updatedAt) > new Date(test.publishedAt);
                  const dimmed = !test.published || hasUnpublishedEdits;

                  return (
                    <Link
                      key={test.id}
                      href={`/dashboard/teacher/tests/${test.id}`}
                      className={
                        dimmed
                          ? "text-ink-soft/50 hover:text-ink-soft"
                          : "text-ink hover:text-marker"
                      }
                      title={
                        !test.published
                          ? "გამოუქვეყნებელი"
                          : hasUnpublishedEdits
                          ? "შენახულია ცვლილება — ჯერ არ არის თავიდან გამოქვეყნებული"
                          : ""
                      }
                    >
                      <HScrollText className="inline-block max-w-full align-bottom">
                        {test.title} [{themeIndex + 1}.{typeIndex + 1}.{testIndex + 1}]
                      </HScrollText>
                    </Link>
                  );
                })}
                {templateReady ? (
                  <Link
                    href={`/dashboard/teacher/tests/new?themeId=${theme.id}&type=${type}`}
                    className="text-marker font-medium text-[22px] leading-none px-2 py-0.5 -ml-2"
                  >
                    +
                  </Link>
                ) : (
                  <span
                    className="text-ink-soft/40 cursor-not-allowed text-[22px] leading-none px-2 py-0.5 -ml-2"
                    title="ეს შაბლონი ჯერ არ არის მზად"
                  >
                    +
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          message={fillTemplate(deleteConfirmTemplate, { name: theme.name })}
          onConfirm={async () => {
            setConfirmingDelete(false);
            const error = await onDelete();
            if (error) setDeleteError(error);
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
