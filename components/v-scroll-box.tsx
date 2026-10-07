"use client";

import { useEffect, useRef, useState } from "react";

const MIN_THUMB = 28; // სქროლის კუბიკის მინიმალური სიმაღლე, px

/**
 * Vertical counterpart of HScrollText: a fixed-height frame whose content can
 * be scrolled (touch scroll on mobile, wheel / click-and-drag on desktop).
 * A fade at whichever edge (top / bottom) still has hidden content hints
 * that there's more to scroll. The native scrollbar stays hidden.
 *
 * With `showScrollbar`, a narrow always-visible custom bar (marker red) is
 * drawn on the right whenever the content is scrollable. It can be dragged.
 *
 * Pass the frame's height (and any text styling) through `className`,
 * e.g. className="h-[3.75rem] leading-5".
 */
export default function VScrollBox({
  children,
  className = "",
  drag = true,
  showScrollbar = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** click-and-drag scrolling on desktop; turn off for boxes with buttons/selectable text */
  drag?: boolean;
  /** always-visible narrow scrollbar on the right when content is scrollable */
  showScrollbar?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState<{ top: boolean; bottom: boolean }>({
    top: false,
    bottom: false,
  });
  const [bar, setBar] = useState<{ show: boolean; top: number; height: number }>({
    show: false,
    top: 0,
    height: 0,
  });
  const dragState = useRef<{ startY: number; startScroll: number } | null>(
    null
  );
  const thumbDrag = useRef<{ startY: number; startScroll: number } | null>(
    null
  );

  function updateFade() {
    const el = ref.current;
    if (!el) return;
    setFade({
      top: el.scrollTop > 2,
      bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 2,
    });

    if (!showScrollbar) return;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 1) {
      setBar((prev) => (prev.show ? { show: false, top: 0, height: 0 } : prev));
      return;
    }
    const trackH = el.clientHeight;
    const thumbH = Math.max(MIN_THUMB, (el.clientHeight / el.scrollHeight) * trackH);
    const top = (el.scrollTop / max) * (trackH - thumbH);
    setBar({ show: true, top, height: thumbH });
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

  function onThumbDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    thumbDrag.current = { startY: e.clientY, startScroll: el.scrollTop };
  }

  function onThumbMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || !thumbDrag.current) return;
    const max = el.scrollHeight - el.clientHeight;
    const travel = el.clientHeight - bar.height;
    if (travel <= 0 || max <= 0) return;
    el.scrollTop =
      thumbDrag.current.startScroll +
      ((e.clientY - thumbDrag.current.startY) / travel) * max;
  }

  function onThumbUp() {
    thumbDrag.current = null;
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

  const scroller = (
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

  if (!showScrollbar) return scroller;

  return (
    <div className="relative">
      {scroller}
      {bar.show && (
        <div className="absolute top-0 bottom-0 right-0 w-1 bg-paper-line/60 pointer-events-none">
          <div
            onPointerDown={onThumbDown}
            onPointerMove={onThumbMove}
            onPointerUp={onThumbUp}
            onPointerCancel={onThumbUp}
            style={{ top: bar.top, height: bar.height }}
            className="absolute left-0 w-full rounded-full bg-marker pointer-events-auto touch-none"
          />
        </div>
      )}
    </div>
  );
}
