"use client";

import { useEffect, useRef, useState } from "react";

export type DropdownOption = {
  value: string;
  label: string;
  disabled?: boolean; // dimmed, non-selectable row
};

export default function DropdownSelect({
  value,
  onChange,
  options,
  placeholder = "— აირჩიეთ —",
  required,
  disabled,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} className="relative">
      {/* Hidden native input keeps HTML `required` form validation working
          without ever showing the browser's own picker UI. */}
      {required && (
        <input
          tabIndex={-1}
          value={value}
          required
          onChange={() => {}}
          className="absolute w-0 h-0 opacity-0 pointer-events-none"
        />
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={
          `w-full border border-paper-line rounded-sm px-3 py-2.5 ` +
          `bg-white font-body text-ink text-sm flex items-center justify-between gap-2 ` +
          `focus:outline-none focus:ring-2 focus:ring-marker/40 focus:border-marker ` +
          `disabled:opacity-50 disabled:cursor-not-allowed ${className}`
        }
      >
        <span className={selected ? "text-ink" : "text-ink-soft"}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="text-ink-soft shrink-0">▾</span>
      </button>

      {open && (
        <ul className="absolute z-40 mt-1 w-full max-h-64 overflow-auto bg-white border border-paper-line rounded-sm shadow-lg">
{options.map((o) =>
  o.disabled ? (
    <li
      key={o.value}
      aria-disabled="true"
      className="pl-[22px] pr-3 py-2.5 font-body text-sm text-ink-soft/60 cursor-default select-none"
    >
      {o.label}
    </li>
  ) : (
    <li key={o.value}>
      <button
        type="button"
        onClick={() => {
          onChange(o.value);
          setOpen(false);
        }}
        className={`w-full text-left px-3 py-2.5 font-body text-sm hover:bg-paper ${
          o.value === value ? "bg-paper text-marker" : "text-ink"
        }`}
      >
        {o.label}
      </button>
    </li>
  )
)}
        </ul>
      )}
    </div>
  );
}
