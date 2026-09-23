"use client";

import { useEffect, useState, FormEvent } from "react";
import { TYPE_LABELS, TestTemplate } from "./tests/types";
import DropdownSelect from "@/components/dropdown-select";

type GroupOption = {
  id: string;
  name: string;
  students: { id: string; label: string }[];
};
type TestOption = {
  id: string;
  label: string;
};

type Status = "idle" | "sending" | "sent" | "error";

export default function TesterStartTab() {
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [tests, setTests] = useState<TestOption[]>([]);
  const [selection, setSelection] = useState(""); // "group:<id>" ან "student:<id>"
  const [testId, setTestId] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/tester/groups")
      .then((r) => r.json())
      .then((data) =>
        setGroups(
          (data.groups ?? []).map(
  (g: {
    id: string;
    name: string;
    students?: {
      id: string;
      name: string | null;
      surname: string | null;
    }[];
  }) => ({
    id: g.id,
    name: g.name,
    students: (g.students ?? []).map((s) => ({
      id: s.id,
      label: [s.name, s.surname].filter(Boolean).join(" ") || "—",
    })),
  })
)
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
    if (!selection || !testId) return;
    setStatus("sending");
    setError("");

    const [kind, id] = selection.split(":");
    const body = kind === "student" ? { studentId: id, testId } : { groupId: id, testId };

    const res = await fetch("/api/tester/send-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
      <div className="w-screen relative left-1/2 -ml-[50vw] flex flex-col items-center gap-5">
        <div className="w-[80vw]">
          <label className="block text-sm text-ink-soft mb-2">
            აირჩიე ჯგუფი ან მოსწავლე
          </label>
          <DropdownSelect
            value={selection}
            onChange={setSelection}
            required
            options={groups.flatMap((g) => [
  { value: `group:${g.id}`, label: g.name },
  ...g.students.map((s) => ({
    value: `student:${s.id}`,
    label: s.label,
    indent: true,
  })),
])}
          />
        </div>

        <div className="w-[80vw]">
          <label className="block text-sm text-ink-soft mb-2">
            აირჩიე ტესტი
          </label>
          <DropdownSelect
            value={testId}
            onChange={setTestId}
            required
            options={tests.map((t) => ({ value: t.id, label: t.label, indent: true }))}
          />
        </div>
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
        <p className="text-[15px] font-display font-semibold text-ledger text-center">
          ტესტი წარმატებით გაიგზავნა ✓
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-marker-dark text-center">{error}</p>
      )}
    </form>
  );
}