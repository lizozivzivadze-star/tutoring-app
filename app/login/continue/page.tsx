"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import UiIcon from "@/components/ui-icon";
import { copyText, detectInstallEnv, getEnvSignals } from "@/lib/install-env";

function ContinueForm() {
  const params = useSearchParams();
  const token = params.get("token");
  // ტოკენი არსებობს → ავტომატურად ვაგრძელებთ, ამიტომ თავიდანვე "working"
  // (რომ ღილაკი "შესვლა" წამით არ აციმციმდეს). თუ ავტომატური გადასვლა
  // არ ხდება (iOS/ბოტი), ეფექტი "idle"-ზე გადაიყვანს.
  const [status, setStatus] = useState<"idle" | "working" | "error">(
    token ? "working" : "idle"
  );
  const [needsSafari, setNeedsSafari] = useState(false);
  const [copied, setCopied] = useState(false);
  const started = useRef(false); // ტოკენის ერთჯერადობის დასაცავად

  async function handleContinue() {
    if (!token || started.current) return;
    started.current = true;
    setStatus("working");
    try {
      const res = await fetch(
        `/api/auth/verify?token=${encodeURIComponent(token)}`,
        { method: "POST" }
      );
      if (res.redirected) {
        window.location.href = res.url;
        return;
      }
    } catch {
      // ქსელის შეცდომა — ქვემოთ "error"
    }
    started.current = false;
    setStatus("error");
  }

  // iPhone-ზე ბმული Safari-ში არ გაიხსნა (Chrome, Firefox... ან ჩაშენებული
  // ბრაუზერი): აპის ეკრანზე დამატება მხოლოდ Safari-დან ადვილდება.
  // სხვა შემთხვევაში (და თუ ბოტი არ არის) ავტომატურად ვაგრძელებთ.
  useEffect(() => {
    const env = detectInstallEnv(getEnvSignals());
    const iosNeedsSafari = env === "ios-other" || env === "inapp-ios";
    setNeedsSafari(iosNeedsSafari);

    const isBot = navigator.webdriver === true;
    if (iosNeedsSafari || isBot || !token) {
      setStatus("idle");
      return;
    }
    handleContinue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ტოკენს აქ არ ვხარჯავთ (ის მხოლოდ "შესვლა"-ზე იწვის), ამიტომ იგივე
  // გვერდის Safari-ში გახსნა უსაფრთხოა.
  function handleOpenSafari() {
    window.location.href = "x-safari-" + window.location.href;
  }

  async function handleCopy() {
    setCopied(await copyText(window.location.href));
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
      {status !== "working" && (
        <p className="text-ink mb-6">დააჭირეთ გასაგრძელებლად</p>
      )}
      <button
        onClick={handleContinue}
        disabled={status === "working" || !token}
        className="w-full rounded-full bg-gold text-ink font-medium py-3
                   hover:bg-gold-hover transition-colors disabled:opacity-50"
      >
        {status === "working" ? "შემოწმება..." : "შესვლა"}
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
