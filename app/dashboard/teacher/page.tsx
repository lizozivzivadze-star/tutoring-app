"use client";

import { useEffect, useState, FormEvent } from "react";
import { TYPE_LABELS, TestTemplate } from "./tests/types";

type GroupOption = { id: string; name: string };
type TestOption = {
  id: string;
  label: string; // "თემა · type 1 · სათაური" — Image 3's note: never ambiguous
};

type Status = "idle" | "sending" | "sent" | "error";

export default function StartTab() {
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [tests, setTests] = useState<TestOption[]>([]);
  const [groupId, setGroupId] = useState("");
  const [testId, setTestId] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/groups")
      .then((r) => r.json())
      .then((data) =>
        setGroups(
          (data.groups ?? []).map((g: { id: string; name: string }) => ({
            id: g.id,
            name: g.name,
          }))
        )
      );

    fetch("/api/themes")
      .then((r) => r.json())
      .then((data) => {
        type ThemeWithTests = {
          name: string;
          tests: {
            id: string;
            type: TestTemplate;
            title: string;
            published: boolean;
          }[];
        };
        const flattened: TestOption[] = (data.themes ?? []).flatMap(
          (theme: ThemeWithTests) =>
            theme.tests
              .filter((t) => t.published)
              .map((t) => ({
                id: t.id,
                label: `${theme.name} · ${TYPE_LABELS[t.type]} · ${t.title}`,
              }))
        );
        setTests(flattened);
      });
  }, []);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!groupId || !testId) return;
    setStatus("sending");
    setError("");

    const res = await fetch("/api/send-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, testId }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "გაგზავნა ვერ მოხერხდა.");
      setStatus("error");
      return;
    }

    setStatus("sent");
  }

  return (
    <form onSubmit={handleSend} className="flex flex-col gap-5">
      <div>
        <label className="block text-sm text-ink-soft mb-2">
          აირჩიე ჯგუფი
        </label>
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          required
          className="w-full border border-paper-line rounded-sm px-3 py-2.5
                     bg-white font-body text-ink text-sm
                     focus:outline-none focus:ring-2 focus:ring-marker/40 focus:border-marker"
        >
          <option value="" disabled>
            — აირჩიეთ —
          </option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-ink-soft mb-2">
          აირჩიე ტესტი
        </label>
        <select
          value={testId}
          onChange={(e) => setTestId(e.target.value)}
          required
          className="w-full border border-paper-line rounded-sm px-3 py-2.5
                     bg-white font-body text-ink text-sm
                     focus:outline-none focus:ring-2 focus:ring-marker/40 focus:border-marker"
        >
          <option value="" disabled>
            — აირჩიეთ —
          </option>
          {tests.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-2 rounded-full bg-marker text-white font-body font-medium
                   py-2.5 transition-colors hover:bg-marker-dark
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "sending" ? "იგზავნება..." : "გააგზავნე"}
      </button>

      {status === "sent" && (
        <p className="text-sm text-ledger text-center">sent</p>
      )}
      {status === "error" && (
        <p className="text-sm text-marker-dark text-center">{error}</p>
      )}
    </form>
  );
}
