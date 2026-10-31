"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { TYPE_LABELS, TestTemplate } from "./tests/types";
import DropdownSelect from "@/components/dropdown-select";
import { QUESTION_TIME_SECONDS } from "@/lib/test-taking";
import NewSentTests from "@/components/new-sent-tests";
import SentTestsArchive from "@/components/sent-tests-archive";
import CollapsibleSection from "@/components/collapsible-section";
import UiIcon from "@/components/ui-icon";

type GroupOption = {
  id: string;
  name: string;
  students: { id: string; label: string }[];
};
type TestOption = {
  value: string;
  label: string;
  disabled?: boolean;
  indent?: boolean;
  dot?: "green" | "grey";
};

type Status = "idle" | "sending" | "sent" | "error";

export default function TesterStartTab() {
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [themeOptions, setThemeOptions] = useState<TestOption[]>([]);
  const [testsByTheme, setTestsByTheme] = useState<Record<string, TestOption[]>>({});
  const [themeId, setThemeId] = useState("");
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [selection, setSelection] = useState(""); // "group:<id>" ან "student:<id>"
  const [testId, setTestId] = useState("");
  const [timerOn, setTimerOn] = useState(true);
  const [backOn, setBackOn] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [sentCount, setSentCount] = useState(0);
  const lastSentKey = useRef("");
  const [notice, setNotice] = useState<{
    type: "sent" | "duplicate";
    id: number;
  } | null>(null);
  const [noticeShown, setNoticeShown] = useState(false);

  useEffect(() => {
    if (!notice) return;
    setNoticeShown(true);
    const fade = setTimeout(() => setNoticeShown(false), 4500);
    const clear = setTimeout(() => setNotice(null), 5000);
    return () => {
      clearTimeout(fade);
      clearTimeout(clear);
    };
  }, [notice]);

  function showNotice(type: "sent" | "duplicate") {
    setNotice({ type, id: Date.now() });
  }

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
          id: string;
          name: string;
          tests: {
            id: string;
            type: TestTemplate;
            title: string;
            published: boolean;
            activated: boolean;
            _count: { questions: number };
          }[];
        };

        const themeList: TestOption[] = [];
        const byTheme: Record<string, TestOption[]> = {};
        const counts: Record<string, number> = {};
        (data.themes ?? []).forEach((theme: ThemeWithTests) => {
          theme.tests.forEach((t) => {
            counts[t.id] = t._count?.questions ?? 0;
          });

          const published = theme.tests.filter((t) => t.published);
          const types = Array.from(new Set(published.map((t) => t.type)));

          if (published.length === 0) return;
          themeList.push({ value: theme.id, label: theme.name });
          byTheme[theme.id] = [];

          types.forEach((type) => {
            published
              .filter((t) => t.type === type)
              .forEach((t) => {
                byTheme[theme.id].push({
                  value: t.id,
                  label: `${t.title} · ${TYPE_LABELS[type]}`,
                  disabled: !t.activated,
                  dot: t.activated ? "green" : "grey",
                });
              });
          });
        });

        setThemeOptions(themeList);
        setTestsByTheme(byTheme);
        setQuestionCounts(counts);
      });
  }, []);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!selection || !testId) return;

    const key = selection + "|" + testId;
    if (lastSentKey.current === key) {
      showNotice("duplicate");
      return;
    }
    lastSentKey.current = key; // იბლოკება მაშინვე, პასუხის ლოდინის გარეშე
        setNotice(null);
    setStatus("sending");
    setError("");

    const [kind, id] = selection.split(":");
    const extra = { timerEnabled: timerOn, allowBack: backOn };
    const body =
      kind === "student"
        ? { studentId: id, testId, ...extra }
        : { groupId: id, testId, ...extra };

    const res = await fetch("/api/tester/send-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

        if (res.status === 409) {
      setStatus("idle");
      showNotice("duplicate");
      return;
    }

    if (!res.ok) {
      lastSentKey.current = "";
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "გაგზავნა ვერ მოხერხდა.");
      setStatus("error");
      return;
    }

    setStatus("sent");
    showNotice("sent");
    setSentCount((c) => c + 1);
  }

  const active = !!testId;
  const themeActive = !!selection;
  const testStepActive = !!themeId;
  const totalSeconds = (questionCounts[testId] ?? 0) * QUESTION_TIME_SECONDS;
  const timeLabel = `${Math.floor(totalSeconds / 60)}:${String(
    totalSeconds % 60
  ).padStart(2, "0")}`;
  const pillBase =
    "w-[40%] rounded-full border-2 py-1.5 text-sm font-medium transition-colors";
  const pillOn = "border-marker text-marker";
  const pillOff = "border-paper-line text-ink-soft bg-paper";

  return (
    <form onSubmit={handleSend} className="flex flex-col gap-5">
      <div className="flex flex-col gap-5">
        <DropdownSelect
          value={selection}
          onChange={setSelection}
          required
          placeholder="აირჩიეთ ჯგუფი ან მოსწავლე"
                    placeholderInList
          compactList
          options={groups.flatMap((g) => [
            { value: `group:${g.id}`, label: g.name },
            ...g.students.map((s) => ({
              value: `student:${s.id}`,
              label: s.label,
              indent: true,
            })),
          ])}
        />

        <DropdownSelect
          value={themeId}
          onChange={(v) => {
            setThemeId(v);
            setTestId("");
            setTimerOn(true);
            setBackOn(false);
          }}
          disabled={!themeActive}
          placeholder="აირჩიეთ თემა"
                    placeholderInList
          compactList
          options={themeOptions}
        />

        <DropdownSelect
          value={testId}
          onChange={(v) => {
            setTestId(v);
            setTimerOn(true);
            setBackOn(false);
          }}
          required
          disabled={!testStepActive}
          placeholder="აირჩიეთ ტესტი"
                    placeholderInList
          compactList
          options={testsByTheme[themeId] ?? []}
        />
      </div>

      <div className="flex justify-center gap-[6%] mt-2">
        <button
          type="button"
          disabled={!active}
          onClick={() => {
            setTimerOn((v) => !v);
            setBackOn(false);
          }}
          className={`${pillBase} ${active && timerOn ? pillOn : pillOff}`}
        >
          {active && timerOn ? `დრო ${timeLabel}` : "დრო"}
        </button>
        <button
          type="button"
          disabled={!active}
          onClick={() => {
            if (timerOn) return; // უკან დაბრუნება მხოლოდ გამორთულ დროსთან
            setBackOn((v) => !v);
          }}
          className={`${pillBase} ${active && !backOn ? pillOn : pillOff}`}
        >
          {active && !backOn ? "swipe back off" : "swipe back"}
        </button>
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
className="mb-5 rounded-full bg-gold text-ink font-body font-medium
           py-2.5 transition-colors hover:bg-gold-hover
           disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "sending" ? "იგზავნება..." : "გააგზავნე"}
      </button>


      {status === "error" && (
        <p className="text-sm text-danger text-center">{error}</p>
      )}

      {notice && (
        <p
          className={`text-center transition-opacity duration-500 ${
            noticeShown ? "opacity-100" : "opacity-0"
          } ${
            notice.type === "sent"
              ? "text-base font-display font-semibold text-ledger"
              : "text-sm text-danger"
          }`}
        >
          {notice.type === "sent"
            ? (
              <>
                ტესტი წარმატებით გაიგზავნა <UiIcon name="check" />
              </>
            )
            : "ტესტი უკვე გაგზავნილია."}
        </p>
      )}
      <CollapsibleSection openKey="archiveReturn">
        <NewSentTests endpoint="/api/tester/sent-tests" refreshKey={sentCount} />
        <SentTestsArchive endpoint="/api/tester/archive" />
      </CollapsibleSection>
    </form>
  );
}
