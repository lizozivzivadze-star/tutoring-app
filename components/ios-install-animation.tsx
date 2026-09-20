"use client";

import { useEffect, useState } from "react";

// iOS 26 Safari: ⋯ (ქვედა მარჯვენა) → Share → Add to Home Screen → Add.
const STEPS = [
  {
    title: "1. დააჭირეთ ⋯ (სამ წერტილს)",
    hint: "ბრაუზერის ქვედა მარჯვენა კუთხეში. თუ ⋯ არ გიჩანთ და პანელზე პირდაპირ Share ხატულაა (კვადრატი ისრით ↑), დააჭირეთ მას და გადადით მე-3 ნაბიჯზე",
  },
  {
    title: "2. აირჩიეთ „Share“",
    hint: "მენიუში, რომელიც გაიხსნება",
  },
  {
    title: "3. აირჩიეთ „Add to Home Screen“",
    hint: "გადაფურცლეთ ქვემოთ. თუ ვერ ხედავთ, მენიუს ბოლოში „Edit Actions“ → დაამატეთ",
  },
  {
    title: "4. დააჭირეთ „Add“",
    hint: "ზედა მარჯვენა კუთხეში. „Open as Web App“ დატოვეთ ჩართული",
  },
];

function ShareIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 15V3" />
      <path d="M8 7l4-4 4 4" />
      <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}

// პულსირებადი რგოლი იმ ელემენტის გარშემო, რომელზეც უნდა დააჭიროს
function Ring() {
  return (
    <span className="absolute -inset-1.5 rounded-full border-2 border-marker animate-ping motion-reduce:animate-none" />
  );
}

// iOS 26 Safari-ს ქვედა მოტივტივე პანელი: უკან · მისამართი · ⋯
function BottomBar({ highlightMore }: { highlightMore?: boolean }) {
  return (
    <div className="absolute bottom-2 inset-x-2 flex items-center gap-1.5">
      <span className="w-9 h-9 shrink-0 rounded-full bg-paper border border-paper-line flex items-center justify-center text-ink-soft text-lg">
        ‹
      </span>
      <span className="flex-1 min-w-0 h-9 rounded-full bg-paper border border-paper-line px-3 flex items-center justify-between text-[10px] text-ink-soft">
        <span className="truncate">tutoring-app…</span>
        <span>↻</span>
      </span>
      <span
        className={`relative w-9 h-9 shrink-0 rounded-full bg-paper border flex items-center justify-center text-lg ${
          highlightMore
            ? "border-marker text-marker"
            : "border-paper-line text-ink-soft"
        }`}
      >
        {highlightMore && <Ring />}
        {highlightMore && (
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 text-xl animate-bounce motion-reduce:animate-none">
            👇
          </span>
        )}
        ⋯
      </span>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="p-3 flex flex-col gap-2">
      <div className="h-2 w-2/3 rounded bg-paper-line" />
      <div className="h-2 w-full rounded bg-paper-line" />
      <div className="h-2 w-4/5 rounded bg-paper-line" />
    </div>
  );
}

function StepMore() {
  return (
    <>
      <PageSkeleton />
      <BottomBar highlightMore />
    </>
  );
}

function StepShare() {
  return (
    <>
      <PageSkeleton />
      <div className="absolute inset-0 bg-ink/10" />
      <div
        className="absolute bottom-14 right-2 w-36 bg-white rounded-xl border border-paper-line shadow-lg p-1 flex flex-col gap-0.5"
        style={{ animation: "iosGuideSlideUp .5s ease-out both" }}
      >
        <div className="rounded-md px-2.5 py-1.5 text-xs text-ink-soft">
          New Tab
        </div>
        <div className="rounded-md px-2.5 py-1.5 text-xs text-ink font-medium flex items-center justify-between ring-2 ring-marker animate-pulse motion-reduce:animate-none">
          <span>Share</span>
          <ShareIcon />
        </div>
        <div className="rounded-md px-2.5 py-1.5 text-xs text-ink-soft">
          Add Bookmark
        </div>
      </div>
      <BottomBar />
    </>
  );
}

function StepAddToHome() {
  return (
    <>
      <div className="absolute inset-0 bg-ink/20" />
      <div
        className="absolute bottom-0 inset-x-0 bg-paper rounded-t-2xl p-2 flex flex-col gap-1"
        style={{ animation: "iosGuideSlideUp .5s ease-out both" }}
      >
        <div className="mx-auto mb-1 h-1 w-8 rounded-full bg-paper-line" />
        <div className="rounded-md bg-white px-3 py-2 text-xs text-ink-soft">
          Copy
        </div>
        <div className="rounded-md bg-white px-3 py-2 text-xs text-ink-soft">
          Add Bookmark
        </div>
        <div className="relative rounded-md bg-white px-3 py-2 text-xs text-ink font-medium flex items-center justify-between ring-2 ring-marker animate-pulse motion-reduce:animate-none">
          <span>Add to Home Screen</span>
          <span className="text-base leading-none">＋</span>
        </div>
        <div className="text-center text-ink-soft text-xs animate-bounce motion-reduce:animate-none">
          ⌄
        </div>
      </div>
    </>
  );
}

function StepAdd() {
  return (
    <>
      <div className="absolute inset-0 bg-ink/20" />
      <div
        className="absolute inset-x-3 top-8 bg-white rounded-xl border border-paper-line p-3"
        style={{ animation: "iosGuideSlideUp .5s ease-out both" }}
      >
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="text-ink-soft">Cancel</span>
          <span className="text-ink font-medium">Add to Home Screen</span>
          <span className="relative text-marker font-semibold">
            <Ring />
            Add
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt=""
            className="w-10 h-10 rounded-lg"
          />
          <span className="text-sm text-ink">ტუტორი</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-ink-soft">
          <span>Open as Web App</span>
          <span className="relative w-7 h-4 rounded-full bg-ledger">
            <span className="absolute right-0.5 top-0.5 w-3 h-3 rounded-full bg-white" />
          </span>
        </div>
      </div>
    </>
  );
}

export default function IosInstallAnimation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mb-3">
      <style>{`@keyframes iosGuideSlideUp{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

      {/* ნაბიჯების სია ზემოთ დგას: Safari-ს მენიუები ქვემოდან იხსნება და
          ზედა ნაწილს არ ფარავს, ამიტომ ნაბიჯები მთელი დროის განმავლობაში ჩანს */}
      <ol className="flex flex-col gap-1.5 mb-3">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <button
              type="button"
              onClick={() => setStep(i)}
              className={`w-full text-left text-sm ${
                i === step ? "text-marker font-medium" : "text-ink-soft"
              }`}
            >
              {s.title}
            </button>
          </li>
        ))}
      </ol>

      {/* key={step} — ყოველ ნაბიჯზე ანიმაცია თავიდან იწყება */}
      <div
        key={step}
        className="relative mx-auto w-[200px] h-[230px] rounded-[26px] border-2 border-ink/70 bg-white overflow-hidden"
      >
        {step === 0 && <StepMore />}
        {step === 1 && <StepShare />}
        {step === 2 && <StepAddToHome />}
        {step === 3 && <StepAdd />}
      </div>

      <p className="text-xs text-ink-soft text-center mt-3">
        {STEPS[step].hint}
      </p>

      <div className="flex justify-center gap-2 mt-3">
        {STEPS.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`ნაბიჯი ${i + 1}`}
            onClick={() => setStep(i)}
            className={`h-2 w-2 rounded-full ${
              i === step ? "bg-marker" : "bg-paper-line"
            }`}
          />
        ))}
      </div>
    </div>
  );
}