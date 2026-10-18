"use client";

import { useEffect, useRef, useState } from "react";

const THRESHOLD = 70; // რამდენი px-ის გადაწევაა საჭირო refresh-ისთვის
const MAX_PULL = 110;

export default function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    if (!isIOS) return; // Android-ზე Chrome-ს თავისი აქვს

    // შიგნით გადახვეული ელემენტი (სია, ფანჯარა) არ უნდა გააქტიურდეს
    function scrolledInside(el: Element | null) {
      while (el && el !== document.body) {
        const s = getComputedStyle(el);
        if (
          (s.overflowY === "auto" || s.overflowY === "scroll") &&
          el.scrollHeight > el.clientHeight &&
          el.scrollTop > 0
        ) {
          return true;
        }
        el = el.parentElement;
      }
      return false;
    }

    function reset() {
      startY.current = null;
      pullRef.current = 0;
      setPull(0);
    }

    function onStart(e: TouchEvent) {
      if (e.touches.length !== 1 || window.scrollY > 0) return;
      const t = e.target as Element;
      // ველები, ფანჯრები (.fixed) და ელემენტები data-no-ptr-ით გამოვრიცხოთ
      if (t.closest("input, textarea, select, .fixed, [data-no-ptr]")) return;
      if (scrolledInside(t)) return;
      startY.current = e.touches[0].clientY;
    }

    function onMove(e: TouchEvent) {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0 || window.scrollY > 0) {
        reset();
        return;
      }
      pullRef.current = Math.min(MAX_PULL, dy * 0.5);
      setPull(pullRef.current);
    }

    function onEnd() {
      if (startY.current === null) return;
      const reached = pullRef.current >= THRESHOLD;
      startY.current = null;
      if (reached) {
        setRefreshing(true);
        setPull(THRESHOLD);
        window.location.reload();
      } else {
        reset();
      }
    }

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", reset, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", reset);
    };
  }, []);

  if (pull === 0 && !refreshing) return null;

  return (
    <div
      className="fixed left-0 right-0 z-[60] flex justify-center pointer-events-none"
      style={{
        top: "env(safe-area-inset-top)",
        transform: `translateY(${pull - 40}px)`,
      }}
    >
      <div className="w-9 h-9 rounded-full bg-white border border-paper-line shadow-sm flex items-center justify-center text-ink-soft">
        <span
          className={`inline-block ${refreshing ? "animate-spin" : ""}`}
          style={refreshing ? undefined : { transform: `rotate(${pull * 4}deg)` }}
        >
          ↻
        </span>
      </div>
    </div>
  );
}