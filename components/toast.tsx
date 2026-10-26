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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
      <div className="w-full max-w-sm bg-white border border-marker rounded-md px-4 py-3 text-sm text-ink shadow-md flex items-center justify-center gap-2">
        <UiIcon name="check" />
        <span>{message}</span>
      </div>
    </div>
  );
}