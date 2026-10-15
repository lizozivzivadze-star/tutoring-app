"use client";

import { useEffect, useRef } from "react";

const SNAP_DELAY = 200; // ms სქროლის სრული გაჩერების მერე
const SHOW_AFTER_UP = 80; // px ზემოთ სქროლვა (~2 სმ), რომ მენიუ გამოჩნდეს

export default function HideOnScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let lastY = window.scrollY;
    let offset = 0; // 0 = სრულად ჩანს, -h = სრულად დამალულია
    let upRun = 0; // ზემოთ დაგროვილი სქროლი
    let touching = false; // თითი ეკრანზეა თუ არა
    let timer: ReturnType<typeof setTimeout> | undefined;

    function apply(animate: boolean) {
      el!.style.transition = animate ? "transform 260ms ease-out" : "none";
      el!.style.transform = `translateY(${offset}px)`;
    }

    function onScroll() {
      const h = el!.offsetHeight;
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;

      if (y <= h) {
        offset = 0; // გვერდის თავში მენიუ ყოველთვის სრულად ჩანს
        upRun = 0;
        apply(false);
      } else if (dy > 0) {
        upRun = 0;
        offset = Math.max(-h, offset - dy); // ქვემოთ: მიჰყვება სქროლს
        apply(false);
      } else if (dy < 0) {
        upRun -= dy;
        if (upRun >= SHOW_AFTER_UP && offset !== 0) {
          offset = 0; // საკმარისად ასქროლა: რბილად გამოჩნდეს
          apply(true);
        }
      }

      armSnap();
    }

    function armSnap() {
      clearTimeout(timer);
      if (touching) return; // თითი ეკრანზეა: არაფერი "მიიჯაჭვოს"
      timer = setTimeout(() => {
        const h = el!.offsetHeight;
        if (offset < 0 && window.scrollY > h) {
          offset = -h; // ნაწილობრივ დამალული: ბოლომდე დამალე
          apply(true);
        } else if (offset !== 0 && window.scrollY <= h) {
          offset = 0;
          apply(true);
        }
      }, SNAP_DELAY);
    }

    function onTouchStart() {
      touching = true;
      clearTimeout(timer);
    }

    function onTouchEnd() {
      touching = false;
      armSnap();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div ref={ref} className="sticky top-0 z-20 bg-white will-change-transform">
      {children}
    </div>
  );
}