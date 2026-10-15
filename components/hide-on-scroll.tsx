"use client";

import { useEffect, useRef } from "react";

const SNAP_DELAY = 140; // ms სქროლის გაჩერების მერე

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
      } else {
        offset = Math.min(0, Math.max(-h, offset - dy)); // მიჰყვება სქროლს
      }
      apply(false);

      clearTimeout(timer);
      timer = setTimeout(() => {
        // სქროლი გაჩერდა: ბოლომდე დამალე ან ბოლომდე აჩვენე
        offset = offset < -h / 2 && window.scrollY > h ? -h : 0;
        apply(true);
      }, SNAP_DELAY);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div ref={ref} className="sticky top-0 z-20 bg-white will-change-transform">
      {children}
    </div>
  );
}