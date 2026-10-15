"use client";

import { useEffect, useRef, useState } from "react";

// ქვემოთ სქროლვისას მენიუ იმალება, ზემოთ ~2.5 სმ-ზე ისევ ჩნდება.
const HIDE_AFTER_DOWN = 12; // px ქვემოთ სქროლვა, რომ დაიმალოს
const SHOW_AFTER_UP = 90; // px ზემოთ სქროლვა, რომ გამოჩნდეს

export default function HideOnScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let run = 0; // დაგროვილი სქროლი მიმდინარე მიმართულებით (+ ქვემოთ, − ზემოთ)

    function onScroll() {
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;

      const h = ref.current?.offsetHeight ?? 0;
      if (y <= h) {
        setHidden(false);
        run = 0;
        return;
      }
      if (dy === 0) return;
      if (dy > 0 !== run > 0) run = 0;
      run += dy;
      if (run > HIDE_AFTER_DOWN) setHidden(true);
      else if (run < -SHOW_AFTER_UP) setHidden(false);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={ref}
      className="sticky top-0 z-20 bg-white transition-transform duration-200"
      style={{ transform: hidden ? "translateY(-100%)" : "translateY(0)" }}
    >
      {children}
    </div>
  );
}