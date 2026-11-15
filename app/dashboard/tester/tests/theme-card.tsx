"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeRecord, TestSummary, TYPES, TYPE_LABELS } from "./types";
import ConfirmDialog from "@/components/confirm-dialog";
import { fillTemplate } from "@/lib/template";
import HScrollText from "@/components/h-scroll-text";
import UiIcon from "@/components/ui-icon";
import DragHandleIcon from "@/components/drag-handle-icon";
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const DEFAULT_DELETE_CONFIRM =
  "დარწმუნებული ხარ, რომ გინდა „{name}“-ის წაშლა? წაიშლება მასში არსებული ყველა ტესტიც.";

// ერთი ტესტის ხაზი: ბმული + 6-წერტილიანი სახელური მარჯვნივ
function SortableTestRow({
  test,
  label,
}: {
  test: TestSummary;
  label: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: test.id });

  const hasUnpublishedEdits =
    test.published &&
    !!test.publishedAt &&
    new Date(test.updatedAt) > new Date(test.publishedAt);
  const dimmed = !test.published || hasUnpublishedEdits || !test.activated;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="flex w-full min-w-0 items-center gap-1"
    >
      <Link
        href={`/dashboard/tester/tests/${test.id}`}
        className={`block flex-1 min-w-0 ${
          dimmed
            ? "text-ink-soft/50 hover:text-ink-soft"
            : "text-ink hover:text-marker"
        }`}
        title={
          !test.published
            ? "გამოუქვეყნებელი"
            : !test.activated
            ? "გამოქვეყნებულია, მაგრამ ჯერ არ არის გააქტიურებული"
            : hasUnpublishedEdits
            ? "შენახულია ცვლილება — ჯერ არ არის თავიდან გამოქვეყნებული"
            : ""
        }
      >
        <HScrollText>
          {test.activated ? (
            <span
              aria-hidden="true"
              className="inline-block w-2.5 h-2.5 rounded-full align-middle mr-1.5 bg-ledger"
            />
          ) : (
            <svg
              width="12"
              height="14"
              viewBox="0 0 12 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              aria-hidden="true"
              className="inline-block align-[-1px] mr-1"
            >
              <rect x="1" y="6" width="10" height="7" rx="1.5" />
              <path d="M3.5 6V4a2.5 2.5 0 0 1 5 0v2" />
            </svg>
          )}
          {label}
        </HScrollText>
      </Link>
      <span
        {...attributes}
        {...listeners}
        style={{ touchAction: "none" }}
        className="cursor-grab text-ink-soft/60 select-none shrink-0 inline-flex items-center justify-center h-5"
        title="გადაადგილება"
      >
        <DragHandleIcon />
      </span>
    </div>
  );
}

export default function ThemeCard({
  theme,
  themeIndex,
  expanded,
  onToggleExpand,
  onRename,
  onDelete,
  onReorderTests,
  deleteConfirmTemplate = DEFAULT_DELETE_CONFIRM,
}: {
  theme: ThemeRecord;
  themeIndex: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onRename: (name: string) => Promise<string | void>;
  onDelete: () => Promise<string | void>;
  onReorderTests: (orderedIds: string[]) => void;
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

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: theme.id });

  const testSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleTestDragEnd(ids: string[], event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorderTests(
      arrayMove(ids, ids.indexOf(active.id as string), ids.indexOf(over.id as string))
    );
  }


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
  style={{
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }}
  className={`border rounded-md bg-white px-4 py-3 ${
    expanded ? "border-marker" : "border-paper-line"
  }`}
>

      <div className="flex items-center gap-2">
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
          <button
            onClick={onToggleExpand}
            className="flex-1 min-w-0 text-left"
          >
            <HScrollText className="font-body text-sm font-medium text-ink">
              {themeIndex + 1}. {theme.name}
            </HScrollText>
          </button>
        )}

        <button
          onClick={() => setEditing(true)}
          className="icon-btn text-ink-soft hover:text-marker"
        >
          <UiIcon name="edit" />
        </button>
        <button
          onClick={() => setConfirmingDelete(true)}
          className="icon-btn text-ink-soft hover:text-marker-hover"
        >
          <UiIcon name="x" />
        </button>
        <span
          {...attributes}
          {...listeners}
          style={{ touchAction: "none" }}
          className="cursor-grab text-ink-soft/60 pl-0 pr-0.5 select-none inline-flex items-center justify-center h-7"
          title="გადაადგილება"
        >
          <DragHandleIcon />
        </span>
      </div>

      {renameError && (
        <p className="mt-1 pl-6 text-xs text-danger">{renameError}</p>
      )}
      {deleteError && (
        <p className="mt-1 pl-6 text-xs text-danger">{deleteError}</p>
      )}

      {expanded && (
      <div className="mt-2 pl-6 flex flex-col gap-1.5">
        {TYPES.map((type, typeIndex) => {
          const tests = theme.tests
            .filter((t) => t.type === type)
            .sort((a, b) => a.order - b.order);
          const templateReady = type === "type1";

          return (
            <div key={type} className="text-sm">
              <div className="flex items-center justify-between bg-paper/50 -ml-0.5 pl-0.5 mr-6">
                <span className="text-ink-soft">{TYPE_LABELS[type]}:</span>
                {templateReady ? (
                  <Link
                    href={`/dashboard/tester/tests/new?themeId=${theme.id}&type=${type}`}
                    className="icon-btn text-marker"
                  >
                    <UiIcon name="plus" />
                  </Link>
                ) : (
                  <span
                    className="icon-btn text-ink-soft/40 cursor-not-allowed"
                    title="ეს შაბლონი ჯერ არ არის მზად"
                  >
                    <UiIcon name="plus" className="opacity-40" />
                  </span>
                )}
              </div>
              {tests.length > 0 && (
              <div className="flex flex-col items-start gap-1 mt-1 pl-3">
                <DndContext
                  sensors={testSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleTestDragEnd(tests.map((t) => t.id), e)}
                >
                  <SortableContext
                    items={tests.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {tests.map((test, testIndex) => (
                      <SortableTestRow
                        key={test.id}
                        test={test}
                        label={`${test.title} [${themeIndex + 1}.${typeIndex + 1}.${testIndex + 1}]`}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
              )}
            </div>
          );
        })}
      </div>
      )}

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
