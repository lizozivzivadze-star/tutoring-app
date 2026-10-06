"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function ContinueForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");

  async function handleContinue() {
    if (!token) return;
    setStatus("working");
    try {
      const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`, {
        method: "POST",
      });
      if (res.ok) {
        setStatus("done");
        try {
          window.close();
        } catch {
          // ignore
        }
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="w-full max-w-sm bg-white border border-paper-line rounded-md px-6 py-8 text-center">
        <p className="text-ink font-medium mb-2">დადასტურდა ✓</p>
        <p className="text-ink-soft text-sm leading-relaxed">
          დაბრუნდით იმ ფანჯარაში ან აპში, სადაც მეილი შეიყვანეთ. იქ
          ავტომატურად შეხვალთ. ეს ფანჯარა შეგიძლიათ დახუროთ.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm bg-white border border-paper-line rounded-md px-6 py-8 text-center">
      <p className="text-ink mb-6">დააჭირეთ გასაგრძელებლად</p>
      <button
        onClick={handleContinue}
        disabled={status === "working" || !token}
        className="w-full rounded-full border-2 border-marker text-marker font-medium py-2.5
                   hover:bg-marker hover:text-white transition-colors disabled:opacity-50"
      >
        {status === "working" ? "შემოწმდება..." : "დადასტურება"}
      </button>
      {status === "error" && (
        <p className="mt-4 text-sm text-marker-dark">
          ბმული ვადაგასულია ან უკვე გამოყენებულია — სცადეთ თავიდან.
        </p>
      )}
    </div>
  );
}


export default function ContinuePage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6">
      <Suspense fallback={null}>
        <ContinueForm />
      </Suspense>
    </main>
  );
}