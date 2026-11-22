"use client";

import { useEffect, useState } from "react";
import LoadingBar from "@/components/loading-bar";

const inputClass =
  "w-28 border border-paper-line rounded-sm px-3 py-2.5 font-body text-ink bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-marker/40 focus:border-marker";

type Status = "idle" | "saving" | "saved" | "error";

export default function AdminRulesTab() {
  const [value, setValue] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [openReg, setOpenReg] = useState(false);
  const [regStatus, setRegStatus] = useState<Status>("idle");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        const v = data.settings?.retakeLimit;
        setValue(v == null ? "" : String(v));
        setOpenReg(Boolean(data.settings?.openRegistration));
      });
  }, []);

  // ღია რეგისტრაციის ჩართვა/გამორთვა — დაჭერისთანავე ინახება
  async function toggleOpenReg() {
    const next = !openReg;
    setOpenReg(next);
    setRegStatus("saving");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openRegistration: next }),
    }).catch(() => null);
    if (!res || !res.ok) {
      setOpenReg(!next);
      setRegStatus("error");
      return;
    }
    setRegStatus("saved");
    setTimeout(() => setRegStatus((s) => (s === "saved" ? "idle" : s)), 2000);
  }

  async function save() {
    setStatus("saving");
    setError("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ retakeLimit: value === "" ? null : value }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "ვერ შეინახა");
      setStatus("error");
      return;
    }
    setStatus("saved");
    setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 2000);
  }

  if (value === null) return <LoadingBar />;

  return (
    <div>
      <h2 className="font-display text-lg text-ink border-b border-paper-line pb-2 mb-5">
        ტესტების წესები
      </h2>

      <div className="flex flex-col gap-2 pb-5 mb-5">
        <label className="text-sm text-ink-soft">
          ერთი ტესტის ხელახლა გაკეთების მაქსიმალური რაოდენობა
        </label>
        <p className="text-xs text-ink-soft/70 -mt-1">
          ცარიელი = შეუზღუდავი, 0 = ხელახლა გაკეთება აკრძალულია
        </p>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={(e) =>
            e.currentTarget.scrollIntoView({ behavior: "smooth", block: "center" })
          }
          className={inputClass}
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={status === "saving"}
            className="rounded-full bg-gold text-ink font-body font-medium text-sm
                       px-4 py-2 transition-colors hover:bg-gold-hover
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "saving" ? "ინახება..." : "შენახვა"}
          </button>
          {status === "saved" && <span className="text-sm text-ledger">შენახულია</span>}
          {status === "error" && <span className="text-sm text-danger">{error}</span>}
        </div>
      </div>

      <h2 className="font-display text-lg text-ink border-b border-paper-line pb-2 mb-5">
        რეგისტრაციის წესები
      </h2>

      <div className="flex flex-col gap-2 pb-5 mb-5">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="open-registration" className="text-sm text-ink-soft">
            ღია რეგისტრაცია
          </label>
          <button
            id="open-registration"
            type="button"
            role="switch"
            aria-checked={openReg}
            onClick={toggleOpenReg}
            disabled={regStatus === "saving"}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full
                        transition-colors disabled:opacity-50 ${
                          openReg ? "bg-ledger" : "bg-paper-line"
                        }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                openReg ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-ink-soft/70">
          {openReg
            ? "ჩართულია: მასწავლებელიც და აბიტურიენტიც თავად რეგისტრირდება login გვერდიდან"
            : "გამორთულია: მასწავლებელს არეგისტრირებს ადმინი, აბიტურიენტს — მასწავლებელი"}
        </p>
        {regStatus === "saved" && <span className="text-sm text-ledger">შენახულია</span>}
        {regStatus === "error" && <span className="text-sm text-danger">ვერ შეინახა</span>}
      </div>
    </div>
  );
}
