"use client";

import { useEffect, useRef, useState } from "react";
import ConfirmDialog from "@/components/confirm-dialog";
import UiIcon from "@/components/ui-icon";

// შესვლის ბმულის გაგზავნა: ჯგუფისთვისაც და ერთი მოსწავლისთვისაც ერთნაირად:
// გლობუსი -> შეკითხვა -> "..." -> მხოლოდ მწვანე თოლია 5 წამით -> გლობუსი.
export default function SendLoginButton({
  endpoint,
  count,
  disabled = false,
  onMessage,
}: {
  endpoint: string;
  count: number;
  disabled?: boolean;
  onMessage?: (msg: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  async function send() {
    setState("sending");
    onMessage?.("");
    let next: "ok" | "error" = "error";
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        onMessage?.(data?.error ?? "ვერ გაიგზავნა");
      } else if (data?.failed) {
        onMessage?.(`გაიგზავნა ${data.sent}, ვერ გაიგზავნა ${data.failed}`);
      } else {
        next = "ok";
      }
    } catch {
      onMessage?.("ვერ გაიგზავნა");
    }
    setState(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setState("idle");
      onMessage?.("");
    }, 5000);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (state === "idle" || state === "error") setConfirming(true);
        }}
        disabled={disabled || state === "sending"}
        className="inline-flex items-center justify-center h-7 px-0.5 shrink-0 leading-none text-xs text-ink-soft hover:text-marker disabled:opacity-50"
      >
        {state === "sending" ? (
          "..."
        ) : state === "error" ? (
          "!"
        ) : state === "ok" ? (
          <UiIcon name="check-green" />
        ) : (
          <UiIcon name="send-url" />
        )}
      </button>

      {confirming && (
        <ConfirmDialog
          message={`Login გვერდი გაეგზავნება ${count} მოსწავლეს`}
          onConfirm={() => {
            setConfirming(false);
            send();
          }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}