"use client";

import { useSearchParams } from "next/navigation";

export default function CheckEmailContent({ template }: { template: string }) {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [before, after] = template.split("{email}");

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
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