"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ContinuePage() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");

  async function handleContinue() {
    if (!token) return;
    setStatus("working");
    const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`, {
      method: "POST",
    });
    if (res.redirected) {
      window.location.href = res.url;
    } else {
      setStatus("error");
    }
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white border border-paper-line rounded-md px-6 py-8 text-center">
        <p className="text-ink mb-6">დააჭირეთ გასაგრძელებლად</p>
        <button
          onClick={handleContinue}
          disabled={status === "working" || !token}
          className="w-full rounded-full border-2 border-marker text-marker font-medium py-2.5
                     hover:bg-marker hover:text-white transition-colors disabled:opacity-50"
        >
          {status === "working" ? "შემოწმდება..." : "შესვლა"}
        </button>
        {status === "error" && (
          <p className="mt-4 text-sm text-marker-dark">
            ბმული ვადაგასულია ან უკვე გამოყენებულია — სცადეთ თავიდან.
          </p>
        )}
      </div>
    </main>
  );
}