"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useInstall } from "@/components/install-provider";
import IosInstallAnimation from "@/components/ios-install-animation";
import {
  chromeIntentUrl,
  copyText,
  detectInstallEnv,
  getEnvSignals,
  type InstallEnv,
} from "@/lib/install-env";

type Guide = {
  title: string;
  steps: string[];
  note?: string;
  actions?: ("copy" | "chrome")[];
  animation?: "ios";
};

const GUIDES: Record<InstallEnv, Guide> = {
    "ios-safari": {
    title: "ეკრანზე დასამატებლად:",
    steps: [
      "დააჭირეთ Share ღილაკს (კვადრატი ისრით ↑) ბრაუზერის ქვედა პანელზე, ან ⋯ მენიუს",
      "გადაფურცლეთ ქვემოთ და აირჩიეთ „Add to Home Screen“",
      "დააჭირეთ „Add“",
    ],
    animation: "ios",
  },
    "ios-other": {
    title: "ეკრანზე დასამატებლად:",
    steps: [
      "დააჭირეთ Share ღილაკს (კვადრატი ისრით ↑) — მისამართის ველთან ან ⋯ მენიუში",
      "აირჩიეთ „Add to Home Screen“ და დააჭირეთ „Add“",
    ],
    note: "თუ ასეთ პუნქტს ვერ ხედავთ, გახსენით ეს გვერდი Safari-ში და იქიდან დაამატეთ.",
    actions: ["copy"],
    animation: "ios",
  },
  "inapp-ios": {
    title: "ჯერ ბრაუზერში გახსენით",
    steps: [
      "ეს ჩაშენებული ბრაუზერია (Messenger, Facebook, Instagram და ა.შ.) — აქ ეკრანზე დამატება შეუძლებელია",
      "დააჭირეთ ⋯ ან Share ხატულას და აირჩიეთ „Open in Safari“ (ან „Open in Browser“)",
      "Safari-ში: Share (↑) → „Add to Home Screen“",
    ],
    note: "თუ ასეთი პუნქტი ვერ იპოვეთ, დააკოპირეთ ბმული და ჩასვით Safari-ში.",
    actions: ["copy"],
  },
  "inapp-android": {
    title: "ჯერ Chrome-ში გახსენით",
    steps: [
      "ეს ჩაშენებული ბრაუზერია — აქ ეკრანზე დამატება შეუძლებელია",
      "დააჭირეთ ქვემოთ „Chrome-ში გახსნას“",
      "Chrome-ში ისევ დააჭირეთ „Add to HOME“-ს",
    ],
    note: "თუ არ გაიხსნა, დააკოპირეთ ბმული და ჩასვით Chrome-ში.",
    actions: ["chrome", "copy"],
  },
  "android-firefox": {
    title: "ეკრანზე დასამატებლად:",
    steps: [
      "დააჭირეთ ⋮ მენიუს (ზედა ან ქვედა მარჯვენა კუთხეში)",
      "აირჩიეთ „Install“ ან „Add to Home screen“",
    ],
  },
  "android-other": {
    title: "ეკრანზე დასამატებლად:",
    steps: [
      "დააჭირეთ ბრაუზერის მენიუს (⋮ ან ≡)",
      "აირჩიეთ „Install app“ ან „Add to Home screen“",
    ],
    note: "თუ ასეთ პუნქტს ვერ ხედავთ, გვერდი ბოლომდე ჩატვირთეთ და ხელახლა სცადეთ, ან გახსენით Chrome-ში.",
  },
  "desktop-firefox": {
    title: "Firefox დესკტოპზე აპლიკაციის დამატება მხარდაჭერილი არ არის",
    steps: [
      "გამოიყენეთ Chrome ან Edge",
      "ან გვერდი ჩვეულებრივად ჩანიშნეთ: Ctrl+D (Mac-ზე ⌘+D)",
    ],
  },
  "desktop-other": {
    title: "ეკრანზე დასამატებლად:",
    steps: [
      "Chrome/Edge: მისამართის ველის მარჯვენა მხარეს დააჭირეთ „Install“ ხატულას (ან მენიუ → „Install“)",
      "Safari (Mac): File → „Add to Dock“",
    ],
  },
};

// ღილაკი ახლა ყოველთვის ჩანს. თუ საიტი უკვე ხატულადანაა გახსნილი
// (standalone), დაჭერისას ამას ვეუბნებით და ვუხსნით, როგორ დაამატოს ხელახლა.
const INSTALLED_GUIDE: Guide = {
  title: "აპლიკაცია უკვე დამატებულია",
  steps: [
    "ამჟამად საიტი მთავარი ეკრანის ხატულადან გაქვთ გახსნილი",
    "ხატულის ხელახლა დასამატებლად გახსენით საიტი ბრაუზერში (Safari / Chrome) და იქიდან დააჭირეთ „Add to HOME“-ს",
  ],
};

export default function UserMenu({
  showCancelPending = false,
  cancelEndpoint = "/api/teacher/cancel-pending-tests",
}: {
  showCancelPending?: boolean;
  cancelEndpoint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [guide, setGuide] = useState<Guide | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelResult, setCancelResult] = useState<{ testTitle: string; groupName: string | null; studentName: string | null }[] | null>(null);
  const { canPrompt, installed, promptInstall } = useInstall();

  async function handleAddToHome() {
    setOpen(false);
        if (installed) {
      setCopied(false);
      setGuide(INSTALLED_GUIDE);
      return;
    }

    // Chrome / Edge / Samsung Internet (Android და დესკტოპი): ნამდვილი
    // ერთ-დაწკაპუნებიანი დაინსტალირება.
    if (canPrompt) {
      const result = await promptInstall();
      if (result !== "unavailable") return;
    }

    // ყველა დანარჩენი (iOS, Firefox, ჩაშენებული ბრაუზერები...) —
    // ზუსტად იმ მოწყობილობისთვის მორგებული ინსტრუქცია.
    setCopied(false);
    setGuide(GUIDES[detectInstallEnv(getEnvSignals())]);
  }

  async function handleCopy() {
    const ok = await copyText(window.location.origin + "/");
    setCopied(ok);
  }

  function handleOpenChrome() {
    window.location.href = chromeIntentUrl();
  }

  async function handleCancelPending() {
    setCancelling(true);
    const res = await fetch(cancelEndpoint, { method: "POST" });
    const data = await res.json();
    setCancelling(false);
    setConfirmCancel(false);
    setOpen(false);
    setCancelResult(Array.isArray(data.cancelled) ? data.cancelled : []);
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
          <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-paper-line rounded-md shadow-sm min-w-[200px] py-1 overflow-hidden">
            <button
              onClick={handleAddToHome}
              className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-paper-line/40"
            >
              Add to HOME
            </button>
            {showCancelPending && (
              <button
                onClick={() => {
                  setOpen(false);
                  setConfirmCancel(true);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-marker hover:bg-paper-line/40 border-t border-paper-line"
              >
                წითელი ღილაკი
              </button>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-paper-line/40 border-t border-paper-line"
            >
              Log out
            </button>
          </div>
        </>
      )}

      {guide && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setGuide(null)}
          />
          <div
            className={`fixed left-4 right-4 ${
              guide.animation ? "top-4" : "bottom-6"
            } z-50 bg-white border border-paper-line rounded-md shadow-sm p-4 max-w-sm mx-auto max-h-[80dvh] overflow-y-auto`}
          >

          <p className="text-sm text-ink mb-3 font-medium">{guide.title}</p>
            {guide.animation === "ios" && <IosInstallAnimation />}

            {!guide.animation && (
              <ol className="text-sm text-ink-soft flex flex-col gap-2 list-decimal pl-5">
                {guide.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            )}

            {guide.note && (
              <p className="text-xs text-ink-soft/80 mt-3">{guide.note}</p>
            )}

            {guide.actions?.includes("chrome") && (
              <button
                onClick={handleOpenChrome}
                className="mt-4 w-full rounded-full bg-marker text-white text-sm font-medium py-2"
              >
                Chrome-ში გახსნა
              </button>
            )}
            {guide.actions?.includes("copy") && (
              <button
                onClick={handleCopy}
                className="mt-3 w-full rounded-full border-2 border-marker text-marker text-sm font-medium py-2"
              >
                {copied ? "დაკოპირდა ✓" : "ბმულის დაკოპირება"}
              </button>
            )}

            <button
              onClick={() => setGuide(null)}
              className="mt-3 w-full rounded-full border-2 border-paper-line text-ink-soft text-sm font-medium py-2"
            >
              გასაგებია
            </button>
          </div>
        </>
      )}

      {confirmCancel && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setConfirmCancel(false)} />
          <div className="fixed left-4 right-4 bottom-6 z-50 bg-white border border-paper-line rounded-md shadow-sm p-4 max-w-sm mx-auto">
            <p className="text-sm text-ink mb-4">
              გსურთ გააუქმოთ ყველა გაგზავნილი და ამ მომენტისთვის შეუსრულებელი ტესტი?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCancel(false)}
                className="flex-1 rounded-full border-2 border-paper-line text-ink-soft text-sm font-medium py-2"
              >
                არა
              </button>
              <button
                onClick={handleCancelPending}
                disabled={cancelling}
                className="flex-1 rounded-full bg-marker text-white text-sm font-medium py-2 disabled:opacity-50"
              >
                {cancelling ? "..." : "დიახ"}
              </button>
            </div>
          </div>
        </>
      )}

      {cancelResult && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setCancelResult(null)} />
          <div className="fixed left-4 right-4 bottom-6 z-50 bg-white border border-paper-line rounded-md shadow-sm p-4 max-w-sm mx-auto max-h-[70dvh] overflow-y-auto">
            <p className="text-sm text-ink mb-3 font-medium">
              {cancelResult.length === 0
                ? "გასაუქმებელი ტესტი არ მოიძებნა"
                : `გაუქმდა ${cancelResult.length} ტესტი:`}
            </p>
            {cancelResult.length > 0 && (
              <ul className="text-sm text-ink-soft flex flex-col gap-2 mb-3">
                {cancelResult.map((r, i) => (
                  <li key={i} className="border-b border-paper-line pb-2">
                    <span className="text-ink font-medium">{r.testTitle}</span>
                    {" — "}
                    {r.studentName
                      ? `${r.studentName} (${r.groupName ?? "—"})`
                      : `ჯგუფი: ${r.groupName ?? "—"}`}
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => setCancelResult(null)}
              className="w-full rounded-full border-2 border-paper-line text-ink-soft text-sm font-medium py-2"
            >
              დახურვა
            </button>
          </div>
        </>
      )}
    </div>
  );
}