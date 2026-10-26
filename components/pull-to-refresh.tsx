"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const THRESHOLD = 70; // რამდენი px-ის გადაწევაა საჭირო refresh-ისთვის
const MAX_PULL = 110;
const SHELL_ID = "page-shell"; // layout.tsx-ში children-ს ეს div ახვევია

export default function PullToRefresh() {
  const pathname = usePathname();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);

  useEffect(() => {
    // მთელი გვერდის ჩამოწევა/დაბრუნება
    function moveShell(px: number, animate: boolean) {
      const el = document.getElementById(SHELL_ID);
      if (!el) return;
      if (px === 0 && !animate) {
        el.style.transition = "";
        el.style.transform = "";
        return;
      }
      el.style.transition = animate ? "transform 250ms ease-out" : "none";
      el.style.transform = `translateY(${px}px)`;
      if (px === 0) {
        // transform-ს ბოლოს ვხსნით, რომ fixed ელემენტები ჩვეულებრივად იყოს
        window.setTimeout(() => {
          if (pullRef.current === 0) {
            el.style.transition = "";
            el.style.transform = "";
          }
        }, 280);
      }
    }

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

    // drag-ის სახელურები (touch-action: none) არ უნდა გააქტიურდეს
    function inTouchActionNone(el: Element | null) {
      while (el && el !== document.body) {
        if (getComputedStyle(el).touchAction === "none") return true;
        el = el.parentElement;
      }
      return false;
    }

    function reset() {
      const wasPulling = pullRef.current > 0;
      startY.current = null;
      pullRef.current = 0;
      if (wasPulling) {
        setPull(0);
        moveShell(0, true);
      }
    }

    function onStart(e: TouchEvent) {
      if (((pathname === "/login" || pathname === "/") || pathname === "/")) return;
      if (e.touches.length !== 1 || window.scrollY > 0) return;
      const t = e.target as Element;
      // ველები, ფანჯრები (.fixed) და ელემენტები data-no-ptr-ით გამოვრიცხოთ
      if (t.closest("input, textarea, select, .fixed, [data-no-ptr]")) return;
      if (scrolledInside(t) || inTouchActionNone(t)) return;
      startY.current = e.touches[0].clientY;
    }

    function onMove(e: TouchEvent) {
      if (((pathname === "/login" || pathname === "/") || pathname === "/")) return;
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0 || window.scrollY > 0) {
        reset();
        return;
      }
      // ბრაუზერის საკუთარი გადაწევა/განახლება გამორთულია, ჩვენი მუშაობს
      if (e.cancelable) e.preventDefault();
      pullRef.current = Math.min(MAX_PULL, dy * 0.5);
      setPull(pullRef.current);
      moveShell(pullRef.current, false);
    }

 function onEnd() {
  if ((pathname === "/login" || pathname === "/")) {
    reset();
    return;
  }
  if (startY.current === null) return;
      const reached = pullRef.current >= THRESHOLD;
      startY.current = null;
      if (reached) {
        setRefreshing(true);
        setPull(THRESHOLD);
        moveShell(THRESHOLD, true);
        window.setTimeout(() => window.location.reload(), 250);
      } else {
        reset();
      }
    }

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", reset, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", reset);
    };
  }, [pathname]);

  if (pull === 0 && !refreshing) return null;

  const progress = Math.min(1, pull / THRESHOLD);
  const visible = refreshing ? 12 : Math.round(progress * 12);

  return (
    <div
      className="fixed left-0 right-0 z-[60] flex justify-center pointer-events-none"
      style={{
        top: "env(safe-area-inset-top)",
        // სპინერი ჩამოწეული გვერდის ზემოთ გამოჩენილი სივრცის შუაში დგას
        transform: `translateY(${Math.max(0, pull / 2 - 14)}px)`,
        opacity: refreshing ? 1 : Math.min(1, progress * 1.5),
      }}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        className={refreshing ? "ptr-spin" : ""}
        aria-hidden="true"
      >
        {Array.from({ length: 12 }, (_, i) => (
          <line
            key={i}
            x1="14"
            y1="3"
            x2="14"
            y2="8"
            stroke="#8e8e93"
            strokeWidth="2.4"
            strokeLinecap="round"
            transform={`rotate(${i * 30} 14 14)`}
            opacity={
              i < visible ? (refreshing ? 0.15 + 0.85 * (i / 11) : 1) : 0
            }
          />
        ))}
      </svg>
    </div>
  );
}