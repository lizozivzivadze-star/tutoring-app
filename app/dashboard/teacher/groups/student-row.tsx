"use client";

import { useState } from "react";
import Link from "next/link";
import { StudentRecord } from "./types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Modal from "@/components/modal";
import UiIcon from "@/components/ui-icon";
import DragHandleIcon from "@/components/drag-handle-icon";
import SendUrlIcon from "@/components/send-url-icon";

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
  const [sendState, setSendState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  async function sendLogin() {
    if (sendState === "sending") return;
    setSendState("sending");
    try {
      const res = await fetch(`/api/students/${student.id}/send-login`, {
        method: "POST",
      });
      setSendState(res.ok ? "sent" : "error");
    } catch {
      setSendState("error");
    }
    setTimeout(() => setSendState("idle"), 2500);
  }

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-paper-line rounded-sm bg-paper px-3 py-[8px]"
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
  className="icon-btn text-ink-soft hover:text-ledger"
>
  <UiIcon name="results" />
</Link>


<button
  onClick={onEdit}
  className="icon-btn text-ink-soft hover:text-marker"
>
  <UiIcon name="edit" />
</button>
<button
  onClick={onDelete}
  className="icon-btn text-ink-soft hover:text-marker-hover"
>
  <UiIcon name="x" />
</button>

<button
  onClick={sendLogin}
  disabled={sendState === "sending"}
  className="inline-flex items-center justify-center h-7 px-1 shrink-0 leading-none text-xs text-ink-soft hover:text-marker disabled:opacity-50"
>
  {sendState === "sending" ? (
    "..."
  ) : sendState === "error" ? (
    "!"
  ) : (
    <SendUrlIcon confirmed={sendState === "sent"} durationMs={2500} />
  )}
</button>

        <span
          {...attributes}
          {...listeners}
          style={{ touchAction: "none" }}
          className="cursor-grab text-ink-soft/60 px-1 select-none shrink-0 inline-flex items-center justify-center h-7"
          title="გადაადგილება"
        >
          <DragHandleIcon />
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
              <span className="text-ink-soft">email: </span>
              <span className="text-ink">{student.email}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}