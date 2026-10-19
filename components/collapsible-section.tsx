"use client";

import { useState } from "react";

export default function CollapsibleSection({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);



  function toggle() {
    setOpen((v) => !v);
  }

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex justify-end border-t border-paper-line pt-2 pb-1 text-ink-soft/80 hover:text-ink-soft"
      >
        <span
          className={"arrow-glyph transition-transform " + (open ? "rotate-180" : "")}
        >
          ▾
        </span>
      </button>

      {open && <div className="flex flex-col gap-5">{children}</div>}
    </div>
  );
}