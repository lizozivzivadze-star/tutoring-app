"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { isStandalone } from "@/lib/install-env";

function ContinueForm() {
  const params = useSearchParams();
  const token = params.get("token");
  // ტოკენი არსებობს → ავტომატურად ვაგრძელებთ, ამიტომ თავიდანვე "working"
  // (რომ ღილაკი "შესვლა" წამით არ აციმციმდეს). თუ ავტომატური გადასვლა
  // არ ხდება (ბოტი), ეფექტი "idle"-ზე გადაიყვანს.
  const alreadyConfirmed = params.get("confirmed") === "1";
  const [status, setStatus] = useState<"idle" | "working" | "error" | "confirmed">(
    alreadyConfirmed ? "confirmed" : token ? "working" : "idle"
  );
  const started = useRef(false); // ტოკენის ერთჯერადობის დასაცავად

  // აპის გარეთ (ნებისმიერი ბრაუზერი, მათ შორის Gmail-ის ჩაშენებული):
  // ბმული მხოლოდ ადასტურებს, შესვლას კი ბმულის მომთხოვნი ფანჯარა (აპი)
  // თავად დაასრულებს. თავად აპში გახსნილი ბმული პირდაპირ შედის.
  async function handleContinue() {
    if (!token || started.current) return;
    started.current = true;
    setStatus("working");
    const confirmOnly = !isStandalone();
    try {
      const res = await fetch(
        `/api/auth/verify?token=${encodeURIComponent(token)}${
          confirmOnly ? "&mode=confirm" : ""
        }`,
        { method: "POST" }
      );
      if (confirmOnly) {
        if (res.ok) {
          setStatus("confirmed");
          return;
        }
      } else if (res.redirected) {
        window.location.href = res.url;
        return;
      }
    } catch {
      // ქსელის შეცდომა — ქვემოთ "error"
    }
    started.current = false;
    setStatus("error");
  }

  useEffect(() => {
    if (alreadyConfirmed) return;
    const isBot = navigator.webdriver === true;
    if (isBot || !token) {
      setStatus("idle");
      return;
    }
    handleContinue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "confirmed") {
    return (
      <div className="w-full max-w-sm rounded-md border border-[#f8e7a8]/60 bg-[#fffbe9] px-6 py-8 text-center shadow-sm">
        <p className="mb-1 font-bold text-marker">შესვლა დადასტურდა</p>
        <p className="text-marker">დაბრუნდით აპლიკაციაში</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm bg-white border border-paper-line rounded-md px-6 py-8 text-center">
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
