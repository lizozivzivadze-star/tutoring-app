"use client";

import { useSearchParams } from "next/navigation";

export default function CheckEmailContent() {
  const params = useSearchParams();
  const email = params.get("email");

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="index-card px-6 py-8">
          <h1 className="font-display text-lg text-ink mb-3">
            URL გამოგზავნილია
          </h1>
          <p className="text-ink-soft text-sm leading-relaxed">
            შესვლის ბმული გაიგზავნა
            {email ? <> მისამართზე{" "}<span className="text-ink font-medium">{email}</span></> : " თქვენს ელფოსტაზე"}
            . გახსენით ის ფოსტიდან, რომ გააგრძელოთ.
          </p>
        </div>
      </div>
    </main>
  );
}
