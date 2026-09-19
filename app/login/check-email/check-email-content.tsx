"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function CheckEmailContent({ template }: { template: string }) {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const pollId = params.get("poll");
  const [before, after] = template.split("{email}");
  const [finished, setFinished] = useState(false);

  // ეს გვერდი ხშირად ჩაშენებულ ბრაუზერშია (Messenger და ა.შ.), ბმულს კი
  // მეილიდან სხვა ბრაუზერში ხსნიან — ამიტომ აქედან ვერ ვხვდებით, რომ
  // შესვლა უკვე მოხდა და გვერდი "გაყინული" რჩება. ვამოწმებთ ორ რამეს:
  //  1) ამავე ბრაუზერში შევიდა? (საერთო cookie) → პირდაპირ დაფაზე გადავდივართ;
  //  2) ბმული სადმე სხვაგან გამოიყენეს? → ვაჩვენებთ "შესვლა დასრულდა".
  useEffect(() => {
    let done = false;

    async function check() {
      if (done) return;
      try {
        const sRes = await fetch("/api/auth/session", { cache: "no-store" });
        const session = await sRes.json();
        if (session?.user?.role) {
          done = true;
          window.location.replace("/");
          return;
        }

        if (pollId) {
          const pRes = await fetch(
            `/api/auth/poll?id=${encodeURIComponent(pollId)}`,
            { cache: "no-store" }
          );
          const poll = await pRes.json();
          if (poll?.used) {
            done = true;
            setFinished(true);
            // ჩაშენებული ბრაუზერების უმრავლესობა ამას იგნორირებს — ამიტომ
            // ქვემოთ ტექსტიც გვაქვს. სად მუშაობს, იქ თავისით დაიხურება.
            try {
              window.close();
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // ქსელის შეცდომა — შემდეგ ციკლზე ისევ ვცდით
      }
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") check();
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

  if (finished) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="index-card px-6 py-8">
            <h1 className="font-display text-lg text-ink mb-3">
              შესვლა დასრულდა ✓
            </h1>
            <p className="text-ink-soft text-sm leading-relaxed">
              თქვენ უკვე შეხვედით სხვა ფანჯარაში. ეს ფანჯარა შეგიძლიათ
              დახუროთ (✕ ზედა კუთხეში) და იქ გააგრძელოთ.
            </p>
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
        </div>
      </div>
    </main>
  );
}
