"use client";

import { useState } from "react";
import Modal from "@/components/modal";

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  function close() {
    setOpen(false);
    setStatus("idle");
    setError("");
  }

  async function send() {
    if (!text.trim()) return;
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          page: window.location.pathname,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "ვერ გაიგზავნა");
        setStatus("error");
        return;
      }
      setText("");
      setStatus("sent");
    } catch {
      setError("ვერ გაიგზავნა");
      setStatus("error");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Feedback"
        className="fixed left-4 z-40 w-9 h-9 rounded-full border border-ink-soft/50
                   bg-white text-ink-soft text-base font-medium shadow-sm
                   hover:text-marker hover:border-marker transition-colors"
        style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        ?
      </button>

      {open && (
        <Modal title="Feedback" onClose={close} topAligned>
          {status === "sent" ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-ink text-center">
                მადლობა! შეტყობინება გაიგზავნა ✓
              </p>
              <button
                onClick={close}
                className="rounded-full bg-marker text-white font-medium py-2.5
                           hover:bg-marker-dark transition-colors"
              >
                დახურვა
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <textarea
                autoFocus
                rows={5}
                maxLength={2000}
                placeholder="დაწერეთ თქვენი აზრი ან პრობლემა"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onFocus={(e) =>
                  e.currentTarget.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  })
                }
                className="w-full border border-paper-line rounded-sm px-3 py-2.5
                           font-body text-ink placeholder:text-ink-soft/40
                           focus:outline-none focus:ring-2 focus:ring-marker/40
                           focus:border-marker"
              />
              {error && <p className="text-sm text-marker-dark">{error}</p>}
              <button
                onClick={send}
                disabled={status === "sending" || !text.trim()}
                className="rounded-full bg-marker text-white font-medium py-2.5
                           hover:bg-marker-dark transition-colors disabled:opacity-50"
              >
                {status === "sending" ? "იგზავნება..." : "გაგზავნა"}
              </button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}