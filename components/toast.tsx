"use client";

import { useEffect, useRef } from "react";
import UiIcon from "@/components/ui-icon";

export default function Toast({
  message,
  onClose,
  duration = 4000,
}: {
  message: string;
  onClose: () => void;
  duration?: number;
}) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const t = setTimeout(() => onCloseRef.current(), duration);
    return () => clearTimeout(t);
  }, [message, duration]);

  // მთელი ეკრანი ბუნდოვანდება; ნებისმიერ ადგილას დაჭერა ხურავს შეტყობინებას
  return (
    <div
      onClick={() => onCloseRef.current()}
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[3px] bg-white/30 cursor-pointer"
    >
      <div className="w-1/2 max-w-sm bg-white border border-marker rounded-md px-4 py-4 text-sm text-ink shadow-md flex flex-col items-center gap-2 text-center">
        <UiIcon name="check-green" />
        <span>{message}</span>
      </div>
    </div>
  );
}
