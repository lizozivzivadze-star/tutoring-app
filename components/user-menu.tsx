"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function UserMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        aria-label="მენიუ"
        onClick={() => setOpen((v) => !v)}
        className="flex flex-col gap-1 w-6 shrink-0"
      >
        <span className="h-0.5 bg-ink rounded-full" />
        <span className="h-0.5 bg-ink rounded-full" />
        <span className="h-0.5 bg-ink rounded-full" />
      </button>

      {open && (
        <>
          {/* mobile-friendly: სრული overlay, გარეთ tap-ზე იხურება */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full mt-2 z-50 bg-white border border-paper-line rounded-md shadow-sm min-w-[160px] py-1">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full text-left px-4 py-2.5 text-sm text-marker-dark hover:bg-paper-line/40"
            >
              გასვლა
            </button>
          </div>
        </>
      )}
    </div>
  );
}