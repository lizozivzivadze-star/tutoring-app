"use client";

import { useEffect, useRef, useState } from "react";
import HScrollText from "@/components/h-scroll-text";
import VScrollBox from "@/components/v-scroll-box";

export type DropdownOption = {
  value: string;
  label: string;
  disabled?: boolean; // dimmed, non-selectable row
  indent?: boolean;   // shifted right, e.g. a student under its group
    dot?: "green" | "grey"; // • წერტილი ტექსტის წინ
};

function OptionLabel({ label, dot }: { label: string; dot?: "green" | "grey" }) {
  if (!dot) return <HScrollText>{label}</HScrollText>;
  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={`shrink-0 ${dot === "green" ? "text-ledger" : "text-ink-soft/50"}`}
      >
        •
      </span>
      <HScrollText className="min-w-0 flex-1">{label}</HScrollText>
    </div>
  );
}

export default function DropdownSelect({
  value,
  onChange,
  options,
  placeholder = "— აირჩიეთ —",
  required,
  disabled,
  className = "",
  flipArrow = false,
  centered = false,
  defaultOpen = false,
  borderClassName = "border-paper-line",
  placeholderInList = false,
    compactList = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  flipArrow?: boolean;
  centered?: boolean;
  defaultOpen?: boolean; // გამოჩენისთანავე ჩამოშლილი
  borderClassName?: string; // ღილაკისა და სიის კანტის ფერი
    // true: placeholder-ის ტექსტი სიის #1 სტრიქონადაც ჩანს, ღილაკში კი
  // სიის გახსნისას იმალება
  placeholderInList?: boolean;
    // true: სია მაქსიმუმ 5 სტრიქონს აჩვენებს, დანარჩენი სქროლდება
  compactList?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const rootRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
  const [listMax, setListMax] = useState(220);

  // compactList: ჩამოშლისას ვზომავთ პირველი 5 სტრიქონის რეალურ სიმაღლეს
  useEffect(() => {
    if (!open || !compactList) return;
    const items = Array.from(listRef.current?.children ?? []).slice(0, 5);
    const h = items.reduce((s, el) => s + el.getBoundingClientRect().height, 0);
    if (h > 0) setListMax(Math.round(h));
  }, [open, compactList, options.length]);

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
    <div
      ref={rootRef}
      className="relative"
      style={compactList ? ({ "--list-max": `${listMax}px` } as React.CSSProperties) : undefined}
    >
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
          `w-full border ${borderClassName} rounded-sm px-3 py-2.5 ` +
          `bg-white font-body text-ink text-sm flex items-center justify-between gap-2 ` +
          `focus:outline-none focus:ring-2 focus:ring-marker/40 focus:border-marker ` +
          `disabled:opacity-50 disabled:cursor-not-allowed ${className}`
        }
      >
       <span className={`min-w-0 flex-1 ${centered ? "text-center" : "text-left"} ${selected ? "text-ink" : "text-ink-soft"}`}>
          {selected ? (
            <OptionLabel label={selected.label} dot={selected.dot} />
          ) : (
            placeholderInList && open ? "\u00A0" : placeholder
          )}
        </span>
        <span
          className={`arrow-glyph -my-[2px] text-ink-soft shrink-0 transition-transform ${
            flipArrow && open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {open && (
<div className={`absolute z-40 mt-1 w-full bg-white border ${borderClassName} rounded-sm shadow-lg overflow-hidden`}>
  <VScrollBox drag={false} showScrollbar className={compactList ? "max-h-[var(--list-max)]" : "max-h-64"}>
    <ul ref={listRef}>
          {placeholderInList && (
        <li
          aria-disabled="true"
          className={`${centered ? "text-center" : "text-left"} px-3 py-2.5 font-body text-sm text-ink-soft italic cursor-default select-none`}
        >
          {placeholder}
        </li>
      )}
{options.map((o) =>
  o.disabled ? (
    <li
      key={o.value}
      aria-disabled="true"
      className={`${o.indent ? "pl-[10px] pr-3" : "px-3"} py-2.5 font-body text-sm ${o.dot === "grey" ? "text-ink-soft/50" : "text-ink-soft"} cursor-default select-none`}
    >
      <OptionLabel label={o.label} dot={o.dot} />
    </li>
  ) : (
    <li key={o.value}>
      <button
        type="button"
        onClick={() => {
          onChange(o.value);
          setOpen(false);
        }}
className={`w-full ${centered ? "text-center" : "text-left"} ${o.indent ? "pl-[22px] pr-3" : "px-3"} py-2.5 font-body text-sm hover:bg-paper ${
          o.value === value ? "bg-paper text-marker" : "text-ink"
        }`}
      >
        <OptionLabel label={o.label} dot={o.dot} />
      </button>
    </li>
  )
)}
            </ul>
  </VScrollBox>
</div>
      )}

      {open && (
        <div
          aria-hidden
          className={`absolute left-0 top-full mt-1 ${compactList ? "h-[calc(var(--list-max)+50px)]" : "h-[calc(16rem+50px)]"} w-px pointer-events-none`}
        />
      )}
    </div>
  );
}
