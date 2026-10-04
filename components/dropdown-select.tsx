"use client";

import { useEffect, useRef, useState } from "react";
import HScrollText from "@/components/h-scroll-text";
import VScrollBox from "@/components/v-scroll-box";

export type DropdownOption = {
  value: string;
  label: string;
  disabled?: boolean; // dimmed, non-selectable row
  indent?: boolean;   // shifted right, e.g. a student under its group
};

export default function DropdownSelect({
  value,
  onChange,
  options,
  placeholder = "— აირჩიეთ —",
  required,
  disabled,
  className = "",
  flipArrow = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  flipArrow?: boolean;
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
        <span className={`min-w-0 flex-1 text-left ${selected ? "text-ink" : "text-ink-soft"}`}>
          {selected ? (
            <HScrollText>{selected.label}</HScrollText>
          ) : (
            placeholder
          )}
        </span>
        <span
          className={`text-ink-soft shrink-0 transition-transform ${
            flipArrow && open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {open && (
<div className="absolute z-40 mt-1 w-full bg-white border border-paper-line rounded-sm shadow-lg overflow-hidden">
  <VScrollBox drag={false} className="max-h-64">
    <ul>
{options.map((o) =>
  o.disabled ? (
    <li
      key={o.value}
      aria-disabled="true"
      className={`${o.indent ? "pl-[10px] pr-3" : "px-3"} py-2.5 font-body text-sm text-ink cursor-default select-none`}
    >
      <HScrollText>{o.label}</HScrollText>
    </li>
  ) : (
    <li key={o.value}>
      <button
        type="button"
        onClick={() => {
          onChange(o.value);
          setOpen(false);
        }}
        className={`w-full text-left ${o.indent ? "pl-[22px] pr-3" : "px-3"} py-2.5 font-body text-sm hover:bg-paper ${
          o.value === value ? "bg-paper text-marker" : "text-ink"
        }`}
      >
        <HScrollText>{o.label}</HScrollText>
      </button>
    </li>
  )
)}
            </ul>
  </VScrollBox>
</div>
      )}
    </div>
  );
}
