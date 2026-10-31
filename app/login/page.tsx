
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, FormEvent, CSSProperties } from "react";

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

const fmt = (n?: number) =>
  n === undefined ? "–" : String(n);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);

  const router = useRouter();

  const [appH, setAppH] = useState<number | null>(null);

useEffect(() => {
  const measure = () => {
    const h = Math.min(
      window.innerHeight,
      document.documentElement.clientHeight
    );
    if (h > 0) setAppH(Math.round(h));
  };
  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("orientationchange", measure);
  return () => {
    window.removeEventListener("resize", measure);
    window.removeEventListener("orientationchange", measure);
  };
}, []);

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
        setErrorMessage(
          data?.error ?? "ვერ გაიგზავნა. სცადეთ ხელახლა."
        );
        setStatus("error");
        return;
      }

      setStatus("sent");

      try {
        localStorage.setItem("lastEmail", email.trim());
      } catch {}

      if (data?.pollId && data?.pollSecret) {
        try {
          sessionStorage.setItem(
            `pollSecret:${data.pollId}`,
            data.pollSecret
          );
        } catch {}
      }

      const poll = data?.pollId
        ? `&poll=${encodeURIComponent(data.pollId)}`
        : "";

      router.push(
        `/login/check-email?email=${encodeURIComponent(email)}${poll}`
      );
    } catch {
      setErrorMessage("ვერ გაიგზავნა. სცადეთ ხელახლა.");
      setStatus("error");
    }
  }

  return (
    <main
      data-no-ptr
      style={
        { "--app-h": appH ? `${appH}px` : "100dvh" } as CSSProperties
      }
      className="
        flex h-[var(--app-h)] flex-col items-center
        overflow-y-auto overflow-x-hidden px-6
        lg:h-auto lg:min-h-dvh lg:overflow-visible
      "
    >
      <div
className="
  flex min-h-full w-full max-w-sm flex-col
  lg:h-auto lg:flex-1
"
      >
        {/* ზედა სივრცე */}
        <div
          className="
            h-[clamp(20px,calc(var(--app-h)*0.06625),53px)]
            shrink-0 lg:h-[53px]
          "
        />

        {/* ლოგო */}
        <div className="flex shrink-0 flex-col items-center text-center text-sm text-ink-soft">
          <a href="/" aria-label="Tvinion">
            <Image
              src="/tvinion-logo.png"
              alt="Tvinion"
              width={900}
              height={224}
              priority
              className="h-auto w-56"
            />
          </a>

          <p className="mt-3">ერთი, ორი, სამი</p>
        </div>

        {/* მეორე ზედა სივრცე */}
        <div
          className="
            h-[clamp(20px,calc(var(--app-h)*0.06625),53px)]
            shrink-0 lg:h-[53px]
          "
        />

        {/* სტატისტიკა */}
        <p className="shrink-0 text-center text-sm text-ink-soft">
          {fmt(stats?.subjects)} საგანი (ისტორია),{" "}
          {fmt(stats?.tests)} ტესტი,{" "}
          {fmt(stats?.questions)} შეკითხვა
        </p>

        {/* შესვლის ფორმა */}
        <form
          onSubmit={handleSubmit}
          className="
            my-4 shrink-0 rounded-md border
            border-paper-line bg-white
            px-6 py-6 shadow-sm
          "
        >
          <label
            htmlFor="email"
            className="mb-2 block text-center text-sm text-ink-soft"
          >
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
            placeholder="Email"
            className="
              mb-5 w-full min-w-0 rounded-sm
              border border-paper-line
              px-3 py-2.5
              text-center font-body text-ink
              placeholder:text-ink-soft/50
              focus:border-marker
              focus:outline-none
              focus:ring-2 focus:ring-marker/40
            "
          />

          <button
            type="submit"
            disabled={status === "sending"}
            className="
              w-full rounded-full border-2
              border-marker py-2.5
              font-body font-medium text-marker
              transition-colors
              hover:bg-marker hover:text-white
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {status === "sending"
              ? "იგზავნება..."
              : "გამომიგზავნე URL"}
          </button>

          {status === "error" && (
            <p className="mt-4 text-sm text-danger">
              {errorMessage}
            </p>
          )}
        </form>

        {/* გამოყენების სტატისტიკა */}
        <p className="shrink-0 text-center text-sm text-ink-soft">
          დღეის მდგომარეობით{" "}
          {fmt(stats?.teachers)} მასწავლებელმა ჩაატარა{" "}
          {fmt(stats?.sentTests)} ტესტი, ხოლო{" "}
          {fmt(stats?.students)} მოსწავლემ გააკეთა{" "}
          {fmt(stats?.attempts)} ტესტი.
        </p>

        {/* მთავარი რეგულირებადი სივრცე */}
        <div className="min-h-0 flex-1 lg:flex-[2_1_0%]" />

        {/* ქვედა ტექსტი */}
        <p
className="
  w-full shrink-0 pb-5
  text-center text-[11px] leading-4
  text-ink-soft
  lg:pb-4
"
        >
          ყველა ტესტი/შეკითხვა უნიკალურია და არ მეორდება.
          მასალა მომზადებულია განათლების სამინისტროს
          მიერ გრიფირებული სახელმძღვანელოების მიხედვით
        </p>
      </div>
    </main>
  );
}
