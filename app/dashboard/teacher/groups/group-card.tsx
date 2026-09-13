"use client";

import { useState } from "react";
import { GroupRecord, StudentRecord } from "./types";
import StudentRow from "./student-row";
import ConfirmDialog from "@/components/confirm-dialog";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";

export default function GroupCard({
  group,
  expanded,
  onToggleExpand,
  onRename, onDelete,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onReorderStudents,
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
}) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(group.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [renameError, setRenameError] = useState("");
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
  touchAction: "none" as const,
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

function handleStudentDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  const ids = group.students.map((s) => s.id);
  const fromIndex = ids.indexOf(active.id as string);
  const toIndex = ids.indexOf(over.id as string);
  onReorderStudents(arrayMove(ids, fromIndex, toIndex));
}

  return (
    <div
  ref={setNodeRef}
  style={style}
  {...attributes}
  {...listeners}
  className="border border-paper-line rounded-md bg-white"
>
      <div className="flex items-center gap-3 px-4 py-3">
        <input
          type="checkbox"
          checked={expanded}
          onChange={onToggleExpand}
          className="w-4 h-4 accent-marker shrink-0"
          aria-label="გახსნა/დახურვა"
        />

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
            className="flex-1 text-left font-display text-ink"
          >
            {group.name}
          </button>
        )}

        <button
          onClick={() => setEditing(true)}
          className="text-xs text-ink-soft hover:text-marker px-1"
        >
          edit
        </button>
        <button
          onClick={() => setConfirmingDelete(true)}
          className="text-xs text-ink-soft hover:text-marker-dark px-1"
        >
          ×
        </button>
        <span
          className="cursor-grab text-ink-soft/60 px-1 select-none"
          title="გადაადგილება"
        >
          ⠿
        </span>
      </div>

      {renameError && (
        <p className="px-4 pb-2 text-xs text-marker-dark">{renameError}</p>
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
        {group.students.map((student, i) => (
          <StudentRow
            key={student.id}
            student={student}
            index={i}
            onEdit={() => onEditStudent(student)}
            onDelete={() => onDeleteStudent(student)}
          />
        ))}
      </SortableContext>
    </DndContext>

    <button
      onClick={onAddStudent}
      className="mt-1 text-sm text-marker font-medium text-left hover:text-marker-dark"
    >
      + მოსწავლის დამატება
    </button>
  </div>
)}

      {confirmingDelete && (
        <ConfirmDialog
          message={`დარწმუნებული ხარ, რომ გინდა „${group.name}“-ის წაშლა?`}
          onConfirm={() => {
            setConfirmingDelete(false);
            onDelete();
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
