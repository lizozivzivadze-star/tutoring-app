"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import UiIcon from "@/components/ui-icon";
import { copyText, detectInstallEnv, getEnvSignals } from "@/lib/install-env";

function ContinueForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [needsSafari, setNeedsSafari] = useState(false);
  const [copied, setCopied] = useState(false);

  // iPhone-ზე ბმული Safari-ში არ გაიხსნა (Chrome, Firefox... ან ჩაშენებული
  // ბრაუზერი): აპის ეკრანზე დამატება მხოლოდ Safari-დან ადვილდება.
  useEffect(() => {
    const env = detectInstallEnv(getEnvSignals());
    setNeedsSafari(env === "ios-other" || env === "inapp-ios");
  }, []);

  // ტოკენს აქ არ ვხარჯავთ (ის მხოლოდ "შესვლა"-ზე იწვის), ამიტომ იგივე
  // გვერდის Safari-ში გახსნა უსაფრთხოა.
  function handleOpenSafari() {
    window.location.href = "x-safari-" + window.location.href;
  }

  async function handleCopy() {
    setCopied(await copyText(window.location.href));
  }

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
    <div className="w-full max-w-sm bg-white border border-paper-line rounded-md px-6 py-8 text-center">
      {needsSafari && (
        <div className="mb-6 pb-6 border-b border-paper-line">
          <p className="text-ink-soft mb-3">
            აპის ეკრანზე დასამატებლად გახსენით Safari-ში.
          </p>
          <button
            onClick={handleOpenSafari}
            className="w-full rounded-full bg-gold text-ink font-medium py-2.5
                       hover:bg-gold-hover transition-colors"
          >
            Safari-ში გახსნა
          </button>
          <button
            onClick={handleCopy}
            className="mt-3 w-full rounded-full border-2 border-paper-line text-ink-soft font-medium py-2"
          >
            {copied ? (
              <span className="inline-flex items-center gap-1">
                დაკოპირდა <UiIcon name="check" />
              </span>
            ) : (
              "ბმულის დაკოპირება"
            )}
          </button>
          <p className="text-ink-soft/80 mt-3">
            თუ არ გაიხსნა, დააკოპირეთ ბმული და ჩასვით Safari-ში.
          </p>
        </div>
      )}
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
        <p className="mt-4 text-sm text-danger">
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