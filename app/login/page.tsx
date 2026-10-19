"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, FormEvent } from "react";
import Image from "next/image";

type Status = "idle" | "sending" | "sent" | "error";

type Stats = {
  subjects: number;
  tests: number;
  questions: number;
  teachers: number;
  sentTests: number;
  attempts: number;
  students: number;
};

const fmt = (n?: number) => (n === undefined ? "–" : String(n));

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

    const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/public-stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lastEmail");
      if (saved) setEmail(saved);
    } catch {}
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

            const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMessage(data?.error ?? "ვერ გაიგზავნა. სცადეთ ხელახლა.");
        setStatus("error");
        return;
      }

      // One shared form for both roles — the server decided the role
      // from the email, we never send or know it here.
      setStatus("sent");
      try {
        localStorage.setItem("lastEmail", email.trim());
      } catch {}
            if (data?.pollId && data?.pollSecret) {
        try {
          sessionStorage.setItem(`pollSecret:${data.pollId}`, data.pollSecret);
        } catch {}
      }

      const poll = data?.pollId
        ? `&poll=${encodeURIComponent(data.pollId)}`
        : "";
      router.push(`/login/check-email?email=${encodeURIComponent(email)}${poll}`);
    } catch {
      setErrorMessage("ვერ გაიგზავნა. სცადეთ ხელახლა.");
      setStatus("error");
    }
  }

  return (
    <main className="min-h-dvh flex flex-col items-center px-6 pt-10 pb-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-sm text-ink-soft text-center">
<a href="/" aria-label="Tvinion">
  <Image
    src="/tvinion-logo.png"
    alt="Tvinion"
    width={900}
    height={224}
    priority
    className="w-56 h-auto"
  />
</a>
          <p className="mt-4">ერთი, ორი, სამი</p>
          <p className="mt-2">
            {fmt(stats?.subjects)} საგანი, {fmt(stats?.tests)} ტესტი,{" "}
            {fmt(stats?.questions)} შეკითხვა
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
                    className="my-5 bg-white border border-paper-line rounded-md px-6 py-8 shadow-sm"
        >
         <label htmlFor="email" className="block text-sm text-ink-soft mb-2 text-center">
          შეიყვანეთ
        </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={(e) => e.currentTarget.scrollIntoView({ behavior: "smooth", block: "center" })}
            placeholder="Email"
            className="w-full border border-paper-line rounded-sm px-3 py-2.5 mb-6
                       font-body text-ink text-center placeholder:text-ink-soft/50
                       focus:outline-none focus:ring-2 focus:ring-marker/40 focus:border-marker"
          />

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-full border-2 border-marker text-marker
                       font-body font-medium py-2.5 transition-colors
                       hover:bg-marker hover:text-white
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "sending" ? "იგზავნება..." : "გამომიგზავნე URL"}
          </button>

          {status === "error" && (
            <p className="mt-4 text-sm text-danger">{errorMessage}</p>
          )}
        </form>
      
        <p className="text-sm text-ink-soft text-center">
          დღეის მდგომარეობით {fmt(stats?.teachers)} მასწავლებელმა ჩაატარა{" "}
          {fmt(stats?.sentTests)} ტესტი, ხოლო {fmt(stats?.students)} მოსწავლემ
          გააკეთა {fmt(stats?.attempts)} ტესტი.
        </p>
      </div>

      <p className="mt-auto pt-10 w-full max-w-sm text-[11px] text-ink-soft text-center">
        ყველა ტესტი/შეკითხვა უნიკალურია და არ მეორდება. მასალა მომზადებულია
        განათლების სამინისტროს მიერ გრიფირებული სახელმძღვანელოების მიხედვით
      </p>
    </main>
  );
}