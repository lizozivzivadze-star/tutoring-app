"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import UiIcon from "@/components/ui-icon";

export default function Modal({
  title,
  onClose,
  children,
  topAligned = false,
  onBackdropClick,
  feedbackLayout = false,
}: {
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  // true: popup starts right under the sticky menu (header + tabs)
  // instead of being vertically centered, so an open keyboard
  // doesn't cover the fields.
  topAligned?: boolean;
    feedbackLayout?: boolean;
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

  if (typeof document === "undefined") return null;

  return createPortal(
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
      <div
        ref={cardRef}
        className={`bg-white rounded-md border border-paper-line w-full max-w-sm ${
  feedbackLayout ? "px-6 pt-0 pb-6" : "px-6 py-6"
}`}
      >
        <div
          className={
            feedbackLayout
              ? "flex flex-col mb-5"
              : `flex items-center justify-between ${title ? "mb-5" : "mb-1"}`
          }
        >
          {feedbackLayout ? (
  <>
    <div className="relative h-[36px] mb-0">
      <button
        onClick={onClose}
        aria-label="დახურვა"
        className="icon-btn absolute right-[-14px] top-1/2 -translate-y-1/2 translate-y-[2px] text-ink-soft hover:text-ink"
      >
        <UiIcon name="x" />
      </button>
    </div>

    <h2 className="font-display text-lg text-ink whitespace-nowrap">
      {title}
    </h2>
  </>
) : (
            <>
              <h2 className="font-display text-lg text-ink min-w-0 flex-1 pr-2">
                {title}
              </h2>
              <button
                onClick={onClose}
                aria-label="დახურვა"
                className="icon-btn text-ink-soft hover:text-ink"
              >
                <UiIcon name="x" />
              </button>
            </>
          )}
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}