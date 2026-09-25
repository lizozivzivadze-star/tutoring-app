"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A single-line "frame" for long titles that don't wrap: text overflow is
 * clipped by the frame's edge, but the full text can be dragged/swiped into
 * view (native touch scroll on mobile, click-and-drag on desktop). A fade
 * at whichever edge still has hidden text hints that there's more.
 */
export default function HScrollText({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState<{ left: boolean; right: boolean }>({
    left: false,
    right: false,
  });
  const dragState = useRef<{ startX: number; startScroll: number } | null>(
    null
  );

  function updateFade() {
    const el = ref.current;
    if (!el) return;
    setFade({
      left: el.scrollLeft > 2,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
    });
  }

  useEffect(() => {
    updateFade();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(updateFade);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);

  function onMouseDown(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    dragState.current = { startX: e.clientX, startScroll: el.scrollLeft };
  }

  function onMouseMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el || !dragState.current) return;
    el.scrollLeft =
      dragState.current.startScroll - (e.clientX - dragState.current.startX);
  }

  function endDrag() {
    dragState.current = null;
  }

  const maskParts: string[] = [];
  if (fade.left) maskParts.push("linear-gradient(to right, transparent, black 24px)");
  if (fade.right) maskParts.push("linear-gradient(to left, transparent, black 24px)");
  const maskStyle =
    maskParts.length === 2
      ? { WebkitMaskImage: `${maskParts[0]}, ${maskParts[1]}`, maskImage: `${maskParts[0]}, ${maskParts[1]}`, WebkitMaskComposite: "source-in" as const, maskComposite: "intersect" as const }
      : maskParts.length === 1
      ? { WebkitMaskImage: maskParts[0], maskImage: maskParts[0] }
      : {};

  return (
    <div
      ref={ref}
      onScroll={updateFade}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      style={maskStyle}
      className={`overflow-x-auto whitespace-nowrap cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {children}
    </div>
  );
}