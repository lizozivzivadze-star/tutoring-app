"use client";

import { useEffect, useState } from "react";

// Module-level: a bar that unmounts and immediately re-mounts
// (loading.tsx -> the page's own loading state) continues from where
// it was instead of restarting from 0.
let startedAt = 0;
let lastTick = 0;

export default function LoadingBar({ className = "py-12" }: { className?: string }) {
  const [p, setP] = useState(0);

  useEffect(() => {
    const now = performance.now();
    if (now - lastTick > 500) startedAt = now;

    let raf = 0;
    const tick = () => {
      const t = (performance.now() - startedAt) / 1000;
      lastTick = performance.now();
      // fast phase to ~80% within about 0.6s, then a slow creep towards 95%
      setP(80 * (1 - Math.exp(-t / 0.25)) + 15 * (1 - Math.exp(-t / 5)));
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={`flex justify-center ${className}`}>
      <div className="w-4/5 h-1.5 rounded-full bg-paper-line overflow-hidden">
        <div className="h-full rounded-full bg-marker" style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}