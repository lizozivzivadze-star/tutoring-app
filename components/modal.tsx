"use client";

import { useState } from "react";

export default function Modal({
  title,
  onClose,
  children,
  topAligned = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  // true: popup starts right under the sticky menu (header + tabs)
  // instead of being vertically centered, so an open keyboard
  // doesn't cover the fields.
  topAligned?: boolean;
}) {
  const [top] = useState(() => {
    if (!topAligned || typeof document === "undefined") return 0;
    const menu = document.querySelector("[data-app-menu]");
    return menu ? menu.getBoundingClientRect().bottom : 0;
  });

  return (
    <div
      className={`fixed inset-0 bg-ink/40 flex justify-center z-50 px-6 ${
        topAligned ? "items-start overflow-y-auto pb-6" : "items-center"
      }`}
      style={topAligned ? { paddingTop: top + 8 } : undefined}
    >
      <div className="bg-white rounded-md border border-paper-line px-6 py-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="დახურვა"
            className="text-ink-soft hover:text-ink text-lg leading-none"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}