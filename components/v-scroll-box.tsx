"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Vertical counterpart of HScrollText: a fixed-height frame whose content can
 * be scrolled (touch scroll on mobile, wheel / click-and-drag on desktop).
 * A fade at whichever edge (top / bottom) still has hidden content hints
 * that there's more to scroll. The scrollbar itself stays hidden.
 *
 * Pass the frame's height (and any text styling) through `className`,
 * e.g. className="h-[3.75rem] leading-5".
 */
export default function VScrollBox({
  children,
  className = "",
  drag = true,
}: {
  children: React.ReactNode;
  className?: string;
  /** click-and-drag scrolling on desktop; turn off for boxes with buttons/selectable text */
  drag?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState<{ top: boolean; bottom: boolean }>({
    top: false,
    bottom: false,
  });
  const dragState = useRef<{ startY: number; startScroll: number } | null>(
    null
  );

  function updateFade() {
    const el = ref.current;
    if (!el) return;
    setFade({
      top: el.scrollTop > 2,
      bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 2,
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
    dragState.current = { startY: e.clientY, startScroll: el.scrollTop };
  }

  function onMouseMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el || !dragState.current) return;
    el.scrollTop =
      dragState.current.startScroll - (e.clientY - dragState.current.startY);
  }

  function endDrag() {
    dragState.current = null;
  }

  const maskParts: string[] = [];
  if (fade.top) maskParts.push("linear-gradient(to bottom, transparent, black 16px)");
  if (fade.bottom) maskParts.push("linear-gradient(to top, transparent, black 16px)");
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
      onMouseDown={drag ? onMouseDown : undefined}
      onMouseMove={drag ? onMouseMove : undefined}
      onMouseUp={drag ? endDrag : undefined}
      onMouseLeave={drag ? endDrag : undefined}
      style={maskStyle}
      className={`overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
        drag ? "cursor-grab active:cursor-grabbing select-none" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
