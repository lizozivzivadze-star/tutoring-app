"use client";

import { useEffect, useState } from "react";

export default function CollapsibleSection({
  children,
  openKey,
}: {
  children: React.ReactNode;
  openKey?: string;
}) {
  const [open, setOpen] = useState(false);

  // თუ არქივიდან შედეგზე გადასვლისას მდგომარეობა შევინახეთ, ბლოკი ღია დახვდეს
  useEffect(() => {
    try {
      if (openKey && sessionStorage.getItem(openKey)) setOpen(true);
    } catch {}
  }, [openKey]);



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