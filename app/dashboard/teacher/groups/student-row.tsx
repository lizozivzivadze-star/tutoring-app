"use client";

import { useState } from "react";
import Link from "next/link";
import { StudentRecord } from "./types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Modal from "@/components/modal";

function fullName(student: StudentRecord) {
  return [student.name, student.surname].filter(Boolean).join(" ") || "—";
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
  const [viewing, setViewing] = useState(false);

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
    touchAction: "none" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-paper-line rounded-sm bg-paper px-3 py-2.5"
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="text-ink-soft shrink-0">{index + 1}</span>

        <button
          onClick={() => setViewing(true)}
          className="flex-1 min-w-0 truncate text-left text-ink hover:text-marker transition-colors"
        >
          {fullName(student)}
        </button>

<Link
  href={`/dashboard/teacher/groups/students/${student.id}/history`}
  className="text-xs text-ink-soft hover:text-ledger px-1 shrink-0"
>
  results
</Link>

<button
  onClick={onEdit}
  className="text-[13px] text-ink-soft hover:text-marker px-1 shrink-0"
>
  edit
</button>
<button
  onClick={onDelete}
  className="text-xs text-ink-soft hover:text-marker-dark px-1 shrink-0"
>
  ×
</button>
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab text-ink-soft/60 px-1 select-none shrink-0 text-[18px]"
          title="გადაადგილება"
        >
          ⠿
        </span>
      </div>

      {viewing && (
        <Modal title="მოსწავლის მონაცემები" onClose={() => setViewing(false)}>
          <div className="flex flex-col gap-3 text-sm">
            <div>
              <span className="text-ink-soft">სახელი: </span>
              <span className="text-ink">{student.name || "—"}</span>
            </div>
            <div>
              <span className="text-ink-soft">გვარი: </span>
              <span className="text-ink">{student.surname || "—"}</span>
            </div>
            <div>
              <span className="text-ink-soft">მობილური: </span>
              <span className="text-ink">{student.contact || "—"}</span>
            </div>
            <div>
              <span className="text-ink-soft">email: </span>
              <span className="text-ink">{student.email}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}