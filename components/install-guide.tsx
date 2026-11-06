"use client";

import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useInstall } from "@/components/install-provider";
import IosInstallAnimation from "@/components/ios-install-animation";
import UiIcon from "@/components/ui-icon";
import VScrollBox from "@/components/v-scroll-box";
import {
  chromeIntentUrl,
  copyText,
  detectInstallEnv,
  getEnvSignals,
  type InstallEnv,
} from "@/lib/install-env";

type Guide = {
  title?: string;
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
  steps: [
    "ხატულა უკვე დამატებულია: ტელეფონში მთავარ ეკრანზე იქნება, Windows-ზე Start მენიუში, Mac-ზე კი Launchpad-ში.",
  ],
};

// ერთი საერთო ინსტალაციის ლოგიკა: სენდვიჩის „ეკრანზე" ღილაკიც და
// გვერდის თავის ბარათიც ამას იყენებს. openInstall() = ის, რასაც ადრე
// UserMenu-ს handleAddToHome აკეთებდა; guideModal უნდა ჩაიხატოს JSX-ში.
export function useInstallGuide(): {
  openInstall: () => Promise<void>;
  guideModal: ReactNode;
} {
  const [guide, setGuide] = useState<Guide | null>(null);
  const [copied, setCopied] = useState(false);
  const { canPrompt, installed, promptInstall } = useInstall();

  async function openInstall() {
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

  const guideModal: ReactNode = (
      guide && createPortal(
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setGuide(null)}
          />
          <div className="fixed inset-0 z-50 flex flex-col px-4 pointer-events-none">
            <div className={guide.animation ? "h-4 shrink-0" : "flex-1"} />

            <div className="pointer-events-auto w-full max-w-sm mx-auto bg-white border border-paper-line rounded-md shadow-sm max-h-[80dvh] flex flex-col overflow-hidden">
  <VScrollBox drag={false} className="p-4 min-h-0">
              {guide.title && (
                <p className="text-sm text-ink mb-3 font-medium">{guide.title}</p>
              )}
              {guide.animation === "ios" && <IosInstallAnimation />}

              {!guide.animation && (
                <ol className={`text-sm text-ink-soft flex flex-col gap-2 ${guide.steps.length > 1 ? "list-decimal pl-5" : "list-none text-center"}`}>
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
                  className="mt-4 w-full rounded-full bg-gold text-ink text-sm font-medium py-2"
                >
                  Chrome-ში გახსნა
                </button>
              )}
              {guide.actions?.includes("copy") && (
                <button
                  onClick={handleCopy}
                  className="mt-3 w-full rounded-full border-2 border-marker text-marker text-sm font-medium py-2"
                >
                  {copied ? (
                    <>
                      დაკოპირდა <UiIcon name="check" />
                    </>
                  ) : (
                    "ბმულის დაკოპირება"
                  )}
                </button>
              )}

              <button
                onClick={() => setGuide(null)}
                className="mt-3 w-full rounded-full border-2 border-paper-line text-ink-soft text-sm font-medium py-2"
              >
      გასაგებია
    </button>
  </VScrollBox>
</div>

            <div className={guide.animation ? "flex-1" : "flex-[2]"} />
          </div>
        </>,
        document.body
      )
  );

  return { openInstall, guideModal };
}
