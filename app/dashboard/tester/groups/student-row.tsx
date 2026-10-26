"use client";

import { useState } from "react";
import Link from "next/link";
import { StudentRecord } from "./types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Modal from "@/components/modal";
import UiIcon from "@/components/ui-icon";

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
      const res = await fetch(`/api/tester/students/${student.id}/send-login`, {
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
          href={`/dashboard/tester/groups/students/${student.id}/history`}
          className="text-xs text-ink-soft hover:text-ledger px-1 shrink-0"
        >
          <UiIcon name="results" />
        </Link>

        <button
          onClick={onEdit}
          className="text-base text-ink-soft hover:text-marker px-1 shrink-0"
        >
          <UiIcon name="edit" />
        </button>
        <button
          onClick={onDelete}
          className="glyph-btn text-ink-soft hover:text-marker-hover px-1 shrink-0"
        >
          <UiIcon name="x" />
        </button>

<button
  onClick={sendLogin}
  disabled={sendState === "sending"}
  className="text-xs text-ink-soft hover:text-marker px-1 shrink-0 disabled:opacity-50"
>
  {sendState === "sending" ? (
    "..."
  ) : sendState === "sent" ? (
    <UiIcon name="check" />
  ) : sendState === "error" ? (
    "!"
  ) : (
    <UiIcon name="send-url" />
  )}
</button>
        <span
          {...attributes}
          {...listeners}
          style={{ touchAction: "none" }}
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
              <span className="text-ink-soft">email: </span>
              <span className="text-ink">{student.email}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}