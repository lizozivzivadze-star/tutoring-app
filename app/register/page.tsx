"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Status = "idle" | "sending" | "error";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, code }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMessage(data?.error ?? "რეგისტრაცია ვერ მოხერხდა.");
        setStatus("error");
        return;
      }

      router.push(`/login/check-email?email=${encodeURIComponent(email)}`);
    } catch {
      setErrorMessage("რეგისტრაცია ვერ მოხერხდა. სცადეთ ხელახლა.");
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-md px-6 py-4 mb-6 text-center">
          <h1 className="font-display text-xl font-medium text-ink">
            მასწავლებლის დამატება
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-paper-line rounded-md px-6 py-8 shadow-sm flex flex-col gap-5"
        >
          <div>
            <label htmlFor="name" className="block text-sm text-ink-soft mb-2">
              სახელი
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-paper-line rounded-sm px-3 py-2.5
                         font-body text-ink
                         focus:outline-none focus:ring-2 focus:ring-marker/40 focus:border-marker"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-ink-soft mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-paper-line rounded-sm px-3 py-2.5
                         font-body text-ink
                         focus:outline-none focus:ring-2 focus:ring-marker/40 focus:border-marker"
            />
          </div>

          <div>
            <label htmlFor="code" className="block text-sm text-ink-soft mb-2">
              რეგისტრაციის კოდი
            </label>
            <input
              id="code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="568 620 658 - დარეკეთ, მიიღებთ"
              className="w-full border border-paper-line rounded-sm px-3 py-2.5
                         font-body text-ink placeholder:text-ink-soft/50
                         focus:outline-none focus:ring-2 focus:ring-marker/40 focus:border-marker"
            />
          </div>

          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-full bg-marker text-white font-body font-medium
                       py-2.5 transition-colors hover:bg-marker-dark
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "sending" ? "მუშავდება..." : "დარეგისტრირდი"}
          </button>

          {status === "error" && (
            <p className="text-sm text-marker-dark text-center">
              {errorMessage}
            </p>
          )}
        </form>

        <p className="text-center text-sm text-ink-soft mt-6">
          უკვე გაქვთ ანგარიში?{" "}
          <Link href="/login" className="text-marker font-medium">
            შესვლა
          </Link>
        </p>
      </div>
    </main>
  );
}
