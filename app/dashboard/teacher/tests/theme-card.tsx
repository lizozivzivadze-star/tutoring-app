"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeRecord, TYPES, TYPE_LABELS } from "./types";
import ConfirmDialog from "@/components/confirm-dialog";

export default function ThemeCard({
  theme,
  themeIndex,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onRename,
  onDelete,
}: {
  theme: ThemeRecord;
  themeIndex: number;
  draggable: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onRename: (name: string) => Promise<string | void>;
  onDelete: () => Promise<string | void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(theme.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [renameError, setRenameError] = useState("");
  const [deleteError, setDeleteError] = useState("");

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
      draggable={draggable && !editing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="border border-paper-line rounded-md bg-white px-4 py-3"
    >
      <div className="flex items-center gap-2">
        <span
          className="cursor-grab text-ink-soft/60 select-none"
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
          <span className="flex-1 font-display font-medium text-ink">
            {themeIndex + 1}. {theme.name}
          </span>
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
              <span className="text-ink-soft">{TYPE_LABELS[type]}:</span>{" "}
              {tests.map((test, testIndex) => (
                <Link
                  key={test.id}
                  href={`/dashboard/teacher/tests/${test.id}`}
                  className={`inline-block mr-2 ${
                    test.published
                      ? "text-ink hover:text-marker"
                      : "text-ink-soft/50 hover:text-ink-soft"
                  }`}
                  title={test.published ? "" : "გამოუქვეყნებელი"}
                >
                  [{themeIndex + 1}.{typeIndex + 1}.{testIndex + 1}]
                </Link>
              ))}
              {templateReady ? (
                <Link
                  href={`/dashboard/teacher/tests/new?themeId=${theme.id}&type=${type}`}
                  className="text-marker font-medium"
                >
                  +
                </Link>
              ) : (
                <span
                  className="text-ink-soft/40 cursor-not-allowed"
                  title="ეს შაბლონი ჯერ არ არის მზად"
                >
                  +
                </span>
              )}
            </div>
          );
        })}
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          message={`დარწმუნებული ხარ, რომ გინდა „${theme.name}“-ის წაშლა? წაიშლება მასში არსებული ყველა ტესტიც.`}
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
