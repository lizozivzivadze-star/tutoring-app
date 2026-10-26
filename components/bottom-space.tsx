"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function BottomSpace() {
  const pathname = usePathname();

  useEffect(() => {
    const body = document.body;

    function update() {
      body.style.paddingBottom = "0px";

      // Login გვერდზე დამატებითი 50px არ გვჭირდება
      if ((pathname === "/login" || pathname === "/")) return;

      const overflows =
        document.documentElement.scrollHeight > window.innerHeight + 1;

      body.style.paddingBottom = overflows ? "50px" : "0px";
    }

    function canScrollInside(el: Element | null) {
      while (el && el !== document.body && el !== document.documentElement) {
        const s = getComputedStyle(el);

        if (
          (s.overflowY === "auto" || s.overflowY === "scroll") &&
          el.scrollHeight > el.clientHeight
        ) {
          return true;
        }

        if (
          (s.overflowX === "auto" || s.overflowX === "scroll") &&
          el.scrollWidth > el.clientWidth
        ) {
          return true;
        }

        el = el.parentElement;
      }

      return false;
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length !== 1) return;

      // Login გვერდზე ფონის სქროლი დაიბლოკოს
      if ((pathname === "/login" || pathname === "/")) {
        if (canScrollInside(e.target as Element)) return;
        e.preventDefault();
        return;
      }

      const fits =
        document.documentElement.scrollHeight <= window.innerHeight + 1;

      if (!fits) return;
      if (canScrollInside(e.target as Element)) return;

      e.preventDefault();
    }

    update();

    const ro = new ResizeObserver(update);
    ro.observe(body);

    window.addEventListener("resize", update);
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("touchmove", onTouchMove);
      body.style.paddingBottom = "";
    };
  }, [pathname]);

  return null;
}