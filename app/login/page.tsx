"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Status = "idle" | "sending" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

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

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorMessage(data?.error ?? "ვერ გაიგზავნა. სცადეთ ხელახლა.");
        setStatus("error");
        return;
      }

      // One shared form for both roles — the server decided the role
      // from the email, we never send or know it here.
      setStatus("sent");
      router.push(`/login/check-email?email=${encodeURIComponent(email)}`);
    } catch {
      setErrorMessage("ვერ გაიგზავნა. სცადეთ ხელახლა.");
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Title block — echoes the marker-boxed card from the sketch.
            One shared entry point now, so the label is role-neutral;
            the server decides teacher vs. student from the email. */}
        <div className="index-card px-6 py-4 mb-6 text-center">
          <h1 className="font-display text-xl font-medium text-ink">
            შესვლის გვერდი
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-paper-line rounded-md px-6 py-8 shadow-sm"
        >
          <label htmlFor="email" className="block text-sm text-ink-soft mb-2">
            შეიყვანეთ
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
            className="w-full border border-paper-line rounded-sm px-3 py-2.5 mb-6
                       font-body text-ink placeholder:text-ink-soft/50
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
            <p className="mt-4 text-sm text-marker-dark">{errorMessage}</p>
          )}
        </form>

        <p className="text-center text-sm text-ink-soft mt-6">
          ხართ ახალი მასწავლებელი?{" "}
          <Link href="/register" className="text-marker font-medium">
            დარეგისტრირდი
          </Link>
        </p>
      </div>
    </main>
  );
}
