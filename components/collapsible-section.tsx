"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import LoadingBar from "@/components/loading-bar";

export default function CollapsibleSection({
  children,
  openKey,
}: {
  children: React.ReactNode;
  openKey?: string;
}) {
  const [open, setOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // არქივიდან დაბრუნებისას: ბლოკს ვხსნით და გამოჩენამდე ეკრანს loading bar-ით ვფარავთ
  useLayoutEffect(() => {
    try {
      if (openKey && sessionStorage.getItem(openKey)) {
        setOpen(true);
        setRestoring(true);
      }
    } catch {}
  }, [openKey]);

  // არქივი აცხადებს, რომ მზადაა (ან 3 წამში მაინც ვხსნით)
  useEffect(() => {
    if (!restoring) return;
    const done = () => setRestoring(false);
    window.addEventListener("archive-restored", done);
    const t = setTimeout(done, 3000);
    return () => {
      window.removeEventListener("archive-restored", done);
      clearTimeout(t);
    };
  }, [restoring]);

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

      {restoring &&
        createPortal(
          <div className="fixed inset-0 z-40 bg-paper flex items-center justify-center">
            <LoadingBar />
          </div>,
          document.body
        )}
    </div>
  );
}