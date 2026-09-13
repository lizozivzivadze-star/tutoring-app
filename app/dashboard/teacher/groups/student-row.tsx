"use client";

import { useState } from "react";
import Link from "next/link";
import { StudentRecord } from "./types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Field = "n" | "s" | "c" | "e";

const FIELD_LABELS: Record<Field, string> = {
  n: "n",
  s: "s",
  c: "c",
  e: "e",
};

function valueFor(student: StudentRecord, field: Field) {
  switch (field) {
    case "n":
      return student.name || "—";
    case "s":
      return student.surname || "—";
    case "c":
      return student.contact || "—";
    case "e":
      return student.email;
  }
}

export default function StudentRow({
  student,
  index,
  onEdit,
  onDelete,
}: {
  student: StudentRecord;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [revealed, setRevealed] = useState<Set<Field>>(new Set());
const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
} = useSortable({ id: student.id });

const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.5 : 1,
};
  function toggle(field: Field) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  }

  return (
<div
  ref={setNodeRef}
  style={style}
  {...attributes}
  {...listeners}
  className="border border-paper-line rounded-sm bg-paper px-3 py-2.5"
>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-ink-soft shrink-0">Δ A{index + 1}</span>

        <div className="flex gap-1 ml-1">
          {(["n", "s", "c", "e"] as Field[]).map((field) => (
            <button
              key={field}
              onClick={() => toggle(field)}
              className={`w-6 h-6 rounded-sm text-xs font-medium border transition-colors ${
                revealed.has(field)
                  ? "border-marker text-marker bg-white"
                  : "border-paper-line text-ink-soft hover:border-ink-soft"
              }`}
              title={field}
            >
              {FIELD_LABELS[field]}
            </button>
          ))}
        </div>

        <Link
          href={`/dashboard/teacher/groups/students/${student.id}/history`}
          className="w-6 h-6 flex items-center justify-center rounded-sm text-xs font-medium
                     border border-paper-line text-ink-soft hover:border-ledger hover:text-ledger transition-colors"
          title="ისტორია"
        >
          h
        </Link>

        <div className="flex-1" />

        <button
          onClick={onEdit}
          className="text-xs text-ink-soft hover:text-marker px-1"
        >
          edit
        </button>
        <button
          onClick={onDelete}
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

      {revealed.size > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft pl-7">
          {(["n", "s", "c", "e"] as Field[])
            .filter((f) => revealed.has(f))
            .map((f) => (
              <span key={f}>
                <span className="text-ink-soft/70">{FIELD_LABELS[f]}:</span>{" "}
                <span className="text-ink">{valueFor(student, f)}</span>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
