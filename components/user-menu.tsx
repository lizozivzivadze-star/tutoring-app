"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Instructions = { title: string; body: string };

function getInstallInstructions(): Instructions {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isFirefox = /Firefox/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  if (isIOS) {
    return {
      title: "ეკრანზე დასამატებლად:",
      body: 'დააჭირეთ Share ღილაკს (ქვედა პანელზე) და აირჩიეთ "Add to Home Screen".',
    };
  }
  if (isFirefox && isAndroid) {
    return {
      title: "ეკრანზე დასამატებლად:",
      body: 'დააჭირეთ ⋮ მენიუს (ზედა მარჯვნივ) და აირჩიეთ "Add to Home screen" ან "Install".',
    };
  }
  if (isFirefox) {
    return {
      title: "სამწუხაროდ, Firefox დესკტოპზე ეს ვერსია არ იძლევა აპლიკაციის ეკრანზე დამატების საშუალებას.",
      body: 'ამის ნაცვლად შეგიძლიათ გვერდი ჩვეულებრივად ჩამონიშნოთ: დააჭირეთ Ctrl+D (Mac-ზე ⌘+D).',
    };
  }
  return {
    title: "ეკრანზე დასამატებლად:",
    body: 'გახსენით ბრაუზერის მენიუ და მოძებნეთ "Add to Home Screen" ან "Install app".',
  };
}

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [instructions, setInstructions] = useState<Instructions | null>(null);

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleAddToHome() {
    if (installPrompt) {
      await installPrompt.prompt();
      setInstallPrompt(null);
      setOpen(false);
      return;
    }
    // ბრაუზერი, რომელსაც არ აქვს native prompt (iOS, Firefox და ა.შ.) —
    // ბრაუზერის მიხედვით მორგებული ინსტრუქცია.
    setInstructions(getInstallInstructions());
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        aria-label="მენიუ"
        onClick={() => setOpen((v) => !v)}
        className="flex flex-col gap-1 w-6 shrink-0"
      >
        <span className="h-0.5 bg-ink rounded-full" />
        <span className="h-0.5 bg-ink rounded-full" />
        <span className="h-0.5 bg-ink rounded-full" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-50 bg-white border border-paper-line rounded-md shadow-sm min-w-[200px] py-1 overflow-hidden">
            <button
              onClick={handleAddToHome}
              className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-paper-line/40"
            >
              Add to HOME
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-paper-line/40 border-t border-paper-line"
            >
              გასვლა
            </button>
          </div>
        </>
      )}

      {instructions && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setInstructions(null)}
          />
          <div className="fixed left-4 right-4 bottom-6 z-50 bg-white border border-paper-line rounded-md shadow-sm p-4 max-w-sm mx-auto">
            <p className="text-sm text-ink mb-1 font-medium">
              {instructions.title}
            </p>
            <p className="text-sm text-ink-soft">{instructions.body}</p>
            <button
              onClick={() => setInstructions(null)}
              className="mt-3 w-full rounded-full border-2 border-marker text-marker text-sm font-medium py-2"
            >
              გასაგებია
            </button>
          </div>
        </>
      )}
    </div>
  );
}