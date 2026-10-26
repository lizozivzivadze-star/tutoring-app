"use client";

import { useState } from "react";
import { GroupRecord, StudentRecord } from "./types";
import StudentRow from "./student-row";
import ConfirmDialog from "@/components/confirm-dialog";
import { fillTemplate } from "@/lib/template";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import VScrollBox from "@/components/v-scroll-box";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import UiIcon from "@/components/ui-icon";

const DEFAULT_DELETE_CONFIRM = "დარწმუნებული ხარ, რომ გინდა „{name}“-ის წაშლა?";

export default function GroupCard({
  group,
  expanded,
  onToggleExpand,
  onRename, onDelete,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onReorderStudents,
  deleteConfirmTemplate = DEFAULT_DELETE_CONFIRM,
}: {
  group: GroupRecord;
  expanded: boolean;
  onToggleExpand: () => void;
  onRename: (name: string) => Promise<string | void>;
  onDelete: () => void;
  onAddStudent: () => void;
  onEditStudent: (student: StudentRecord) => void;
  onDeleteStudent: (student: StudentRecord) => void;
  onReorderStudents: (orderedIds: string[]) => void;
  deleteConfirmTemplate?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(group.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [renameError, setRenameError] = useState("");
  const [confirmingInvite, setConfirmingInvite] = useState(false);
const [sendingInvite, setSendingInvite] = useState(false);
const [inviteMsg, setInviteMsg] = useState("");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const studentSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  async function saveRename() {
    if (!draftName.trim() || draftName === group.name) {
      setEditing(false);
      setDraftName(group.name);
      return;
    }
    const error = await onRename(draftName.trim());
    if (error) {
      setRenameError(error);
      return;
    }
    setEditing(false);
  }

async function sendLoginPage() {
  setSendingInvite(true);
  setInviteMsg("");
  try {
    const res = await fetch(`/api/tester/groups/${group.id}/send-login`, {
      method: "POST",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setInviteMsg(data?.error ?? "ვერ გაიგზავნა");
    } else if (data.failed) {
      setInviteMsg(`გაიგზავნა ${data.sent}, ვერ გაიგზავნა ${data.failed}`);
    } else {
      setInviteMsg(`გაიგზავნა ${data.sent} მოსწავლეზე ✓`);
    }
  } catch {
    setInviteMsg("ვერ გაიგზავნა");
  }
  setSendingInvite(false);
}

  function handleStudentDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = group.students.map((s) => s.id);
    const fromIndex = ids.indexOf(active.id as string);
    const toIndex = ids.indexOf(over.id as string);
    onReorderStudents(arrayMove(ids, fromIndex, toIndex));
  }

  const studentRows = group.students.map((student, i) => (
  <StudentRow
    key={student.id}
    student={student}
    index={i}
    onEdit={() => onEditStudent(student)}
    onDelete={() => onDeleteStudent(student)}
  />
));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-md bg-white ${
  expanded ? "border-marker" : "border-paper-line"
}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">

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
            className="flex-1 text-left font-display font-medium text-ink"
          >
            {group.name}
          </button>
        )}

        <button
          onClick={() => setEditing(true)}
          className="text-base text-ink-soft hover:text-marker px-1"
        >
          <UiIcon name="edit" />
        </button>
        <button
          onClick={() => setConfirmingDelete(true)}
          className="glyph-btn text-ink-soft hover:text-marker-hover px-1"
        >
          <UiIcon name="x" />
        </button>

        <button
          onClick={() => setConfirmingInvite(true)}
          disabled={sendingInvite || group.students.length === 0}
          className="text-xs text-ink-soft hover:text-marker px-1 shrink-0 disabled:opacity-50"
        >
          {sendingInvite ? "..." : <UiIcon name="send-url" />}
        </button>
        <span
          {...attributes}
          {...listeners}
          style={{ touchAction: "none" }}
          className="cursor-grab text-ink-soft/60 px-1 select-none text-[18px]"
          title="გადაადგილება"
        >
          ⠿
        </span>
      </div>

      {renameError && (
        <p className="px-4 pb-2 text-xs text-danger">{renameError}</p>
      )}

            {inviteMsg && (
        <p className="px-4 pb-2 text-xs text-ink-soft text-right">{inviteMsg}</p>
      )}

      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-2 border-t border-paper-line pt-3">
          <DndContext
            sensors={studentSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleStudentDragEnd}
          >
            <SortableContext
              items={group.students.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
        {group.students.length > 4 ? (
          <VScrollBox drag={false} showScrollbar className="max-h-[33dvh]">
            <div className="flex flex-col gap-2 pr-2">{studentRows}</div>
          </VScrollBox>
        ) : (
          studentRows
        )}
            </SortableContext>
          </DndContext>

<div className="mt-1 flex flex-col gap-3">
  <button
    onClick={onAddStudent}
    className="text-sm text-marker font-medium text-left hover:text-marker-hover"
  >
    <UiIcon name="plus" /> მოსწავლის დამატება
  </button>
</div>
        </div>
      )}
      {confirmingDelete && (
  <ConfirmDialog
    message={fillTemplate(deleteConfirmTemplate, { name: group.name })}
    onConfirm={() => {
      setConfirmingDelete(false);
      onDelete();
    }}
    onCancel={() => setConfirmingDelete(false)}
  />
)}

{confirmingInvite && (
  <ConfirmDialog
    message={`Log in URL გაეგზავნება ${group.students.length} მოსწავლეს. გავაგზავნო?`}
    onConfirm={() => {
      setConfirmingInvite(false);
      sendLoginPage();
    }}
    onCancel={() => setConfirmingInvite(false)}
  />
)}
    </div>
  );
}