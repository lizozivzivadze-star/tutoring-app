"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "sent-tests-section-open";

export default function CollapsibleSection({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // წინა ჯერზე ღია რომ დატოვა, ისევ ღია იქნება
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") setOpen(true);
    } catch {}
  }, []);

  function toggle() {
    setOpen((v) => {
      const next = !v;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex justify-end border-t border-paper-line pt-2 pb-1 text-ink-soft/50 hover:text-ink-soft"
      >
        <span
          className={"transition-transform " + (open ? "rotate-180" : "")}
        >
          ▾
        </span>
      </button>

      {open && <div className="flex flex-col gap-5">{children}</div>}
    </div>
  );
}