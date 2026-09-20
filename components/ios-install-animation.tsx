"use client";

import { useEffect, useState } from "react";

const STEPS = [
  {
    title: "1. დააჭირეთ Share ღილაკს",
    hint: "კვადრატი ისრით ↑, ბრაუზერის პანელზე ან ⋯ მენიუში",
  },
  {
    title: "2. აირჩიეთ „Add to Home Screen“",
    hint: "თუ ვერ ხედავთ, გადაფურცლეთ მენიუ ქვემოთ",
  },
  {
    title: "3. დააჭირეთ „Add“",
    hint: "ხატულა გამოჩნდება მთავარ ეკრანზე",
  },
];

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
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
    <span className="absolute -inset-2 rounded-full border-2 border-marker animate-ping motion-reduce:animate-none" />
  );
}

function StepShare() {
  return (
    <>
      <div className="p-3 flex flex-col gap-2">
        <div className="h-2 w-2/3 rounded bg-paper-line" />
        <div className="h-2 w-full rounded bg-paper-line" />
        <div className="h-2 w-4/5 rounded bg-paper-line" />
      </div>
      <div className="absolute bottom-0 inset-x-0 h-12 border-t border-paper-line bg-paper flex items-center justify-around px-3 text-ink-soft">
        <span className="text-lg">‹</span>
        <span className="text-lg">›</span>
        <span className="relative text-marker">
          <Ring />
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 text-xl animate-bounce motion-reduce:animate-none">
            👇
          </span>
          <ShareIcon />
        </span>
        <span className="text-lg">▢</span>
        <span className="text-lg">⋯</span>
      </div>
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
      </div>
    </>
  );
}

export default function IosInstallAnimation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mb-3">
      <style>{`@keyframes iosGuideSlideUp{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

      {/* key={step} — ყოველ ნაბიჯზე ანიმაცია თავიდან იწყება */}
      <div
        key={step}
        className="relative mx-auto w-[200px] h-[230px] rounded-[26px] border-2 border-ink/70 bg-white overflow-hidden"
      >
        {step === 0 && <StepShare />}
        {step === 1 && <StepAddToHome />}
        {step === 2 && <StepAdd />}
      </div>

      <p className="text-sm text-ink font-medium text-center mt-3">
        {STEPS[step].title}
      </p>
      <p className="text-xs text-ink-soft text-center mt-1">
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