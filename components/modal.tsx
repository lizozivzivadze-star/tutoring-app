"use client";

import { useRef, useState } from "react";

export default function Modal({
  title,
  onClose,
  children,
  topAligned = false,
  onBackdropClick,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  // true: popup starts right under the sticky menu (header + tabs)
  // instead of being vertically centered, so an open keyboard
  // doesn't cover the fields.
  topAligned?: boolean;
    // გამოიძახება, როცა მომხმარებელი ფანჯრის გარეთ (გამუქებულ ფონზე) დააჭერს
  onBackdropClick?: () => void;
}) {
  const [top] = useState(() => {
    if (!topAligned || typeof document === "undefined") return 0;
    const menu = document.querySelector("[data-app-menu]");
    return menu ? Math.max(0, menu.getBoundingClientRect().bottom) : 0;
  });

    const cardRef = useRef<HTMLDivElement>(null);
  const downOnBackdrop = useRef(false);

  // გარეთ დაჭერა: ხურავს, თუ არცერთ ველში ტექსტი არ წერია
  function handleBackdropClick() {
    if (onBackdropClick) {
      onBackdropClick();
      return;
    }
    const fields = Array.from(
      cardRef.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input:not([disabled]), textarea"
      ) ?? []
    );
    if (!fields.some((f) => f.value.trim() !== "")) onClose();
  }

  return (
    <div
      onPointerDown={(e) => {
        downOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (downOnBackdrop.current && e.target === e.currentTarget) {
          handleBackdropClick();
        }
        downOnBackdrop.current = false;
      }}
      className={`fixed inset-0 bg-ink/40 flex justify-center z-50 px-6 ${
        topAligned ? "items-start overflow-y-auto pb-6" : "items-center"
      }`}
      style={topAligned ? { paddingTop: top + 8 } : undefined}
    >
      <div className="bg-white rounded-md border border-paper-line px-6 py-6 w-full max-w-sm">
      <div ref={cardRef} className="bg-white rounded-md border border-paper-line px-6 py-6 w-full max-w-sm"></div>
        <div className={`flex items-center justify-between ${title ? "mb-5" : "mb-1"}`}>
          <h2 className="font-display text-lg text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="დახურვა"
            className="glyph-btn text-ink-soft hover:text-ink"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}