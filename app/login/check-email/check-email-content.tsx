"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useSearchParams } from "next/navigation";
import LoadingBar from "@/components/loading-bar";

const MAIL_APPS = [
  { name: "Gmail", color: "#d93025", web: "https://mail.google.com/mail/u/0/#inbox", ios: "googlegmail://" },
  { name: "Outlook", color: "#0a64c8", web: "https://outlook.live.com/mail/", ios: "ms-outlook://" },
  { name: "Yahoo", color: "#6001d2", web: "https://mail.yahoo.com/", ios: "ymail://" },
];

function openMail(e: MouseEvent<HTMLAnchorElement>, app: (typeof MAIL_APPS)[number]) {
  // Android/დესკტოპზე ჩვეულებრივი ბმული მუშაობს. iPhone-ზე app-ს
  // პირდაპირ scheme-ით მივმართავთ.
  if (!/iPad|iPhone|iPod/.test(navigator.userAgent)) return;
  e.preventDefault();
  window.location.href = app.ios;
}

export default function CheckEmailContent({ template }: { template: string }) {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const pollId = params.get("poll");
  const [before, after] = template.split("{email}");
  const [finished, setFinished] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [returning, setReturning] = useState(false);

  // ეს გვერდი (ორიგინალი ფანჯარა) უსმენს poll-ის სტატუსს. როცა მეილის
  // ბმული სხვა ბრაუზერში დადასტურდა, აქ pollSecret-ით ვიღებთ სესიას
  // (/api/auth/claim) და პირდაპირ დაფაზე გადავდივართ.
  useEffect(() => {
    let done = false;
    let checking = false;

    async function check() {
      if (done || checking) return;
      checking = true;
      try {
        if (pollId) {
          const pRes = await fetch(
            `/api/auth/poll?id=${encodeURIComponent(pollId)}`,
            { cache: "no-store" }
          );
          const poll = await pRes.json();
          if (poll?.used) {
            done = true;
            let secret = "";
            try {
              secret = sessionStorage.getItem(`pollSecret:${pollId}`) ?? "";
            } catch {}

            if (secret) setSigningIn(true);

            try {
              const cRes = secret
                ? await fetch("/api/auth/claim", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pollId, pollSecret: secret }),
                  })
                : null;
              const claim = cRes?.ok ? await cRes.json().catch(() => null) : null;

              if (claim?.ok && claim.destination) {
                try {
                  sessionStorage.removeItem(`pollSecret:${pollId}`);
                } catch {}
                window.location.replace(claim.destination);
              } else {
                setSigningIn(false);
                setFinished(true);
              }
            } catch {
              // ქსელის შეცდომა — შემდეგ ციკლზე ისევ ვცდით
              done = false;
              setSigningIn(false);
            }
          }
        }
      } catch {
        // ქსელის შეცდომა — შემდეგ ციკლზე ისევ ვცდით
      } finally {
        checking = false;
        if (!done) setReturning(false);
      }
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        // ფანჯარაში დაბრუნებისას ძველ გვერდს ნუ ვაჩვენებთ, სანამ
        // შემოწმება არ დასრულდება
        if (!done && !checking) setReturning(true);
        check();
      }
    };

    const interval = setInterval(check, 2500);
    // ბმულის ვადა 15 წუთია — მერე გამოკითხვას აზრი აღარ აქვს
    const stop = setTimeout(() => clearInterval(interval), 15 * 60 * 1000);

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("pageshow", onVisible); // ფონიდან/მეხსიერებიდან დაბრუნებისას

    return () => {
      done = true;
      clearInterval(interval);
      clearTimeout(stop);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, [pollId]);

  if ((signingIn || returning) && !finished) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <LoadingBar />
        </div>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="index-card px-6 py-8">
            <h1 className="font-display text-lg text-ink mb-3">
              ბმული დადასტურდა
            </h1>
            <p className="text-ink-soft text-sm leading-relaxed mb-4">
              ამ ფანჯარაში ავტომატურად შესვლა ვერ მოხერხდა. სცადეთ თავიდან.
            </p>
            <a href="/login" className="text-marker underline text-sm">
              შესვლის გვერდზე დაბრუნება
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="index-card px-6 py-8">
          <h1 className="font-display text-lg text-ink mb-3">
            URL გამოგზავნილია
          </h1>
          <p className="text-ink-soft text-sm leading-relaxed">
            {before}
            <span className="text-ink font-medium">{email}</span>
            {after}
          </p>
                   <div className="flex justify-center gap-4 mt-6">
            {MAIL_APPS.map((app) => (
              <a
                key={app.name}
                href={app.web}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => openMail(e, app)}
                aria-label={`${app.name}-ის გახსნა`}
                className="flex flex-col items-center gap-1.5 w-16 text-xs text-ink-soft hover:text-ink transition-colors"
              >
                <span className="w-12 h-12 rounded-full border border-paper-line bg-white shadow-sm flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke={app.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3.5 7l8.5 6 8.5-6" />
                  </svg>
                </span>
                {app.name}
              </a>
            ))}
          </div> 
        </div>
      </div>
    </main>
  );
}
