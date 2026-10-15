"use client";

import { useEffect, useRef } from "react";

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
      <div className="w-full max-w-sm bg-green-600 border border-green-700 rounded-md px-4 py-3 text-sm text-white text-center shadow-lg">
        {message}
      </div>
    </div>
  );
}