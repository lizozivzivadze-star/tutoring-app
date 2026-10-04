"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DropdownSelect from "@/components/dropdown-select";
import HScrollText from "@/components/h-scroll-text";

type Row = {
  eventKey: string;
  sentAt: string;
  testId: string;
  testTitle: string;
  groupId: string | null;
  groupName: string;
  groupOrder: number;
  studentId: string;
  studentName: string;
  studentOrder: number;
  score: number;
  total: number;
};

type StudentLine = { id: string; name: string; order: number; score: number; total: number };
type GroupLine = { id: string; name: string; order: number; students: StudentLine[] };
type TestBlock = { key: string; sentAt: string; title: string; groups: GroupLine[] };

const PAGE = 10;

const VIEWS = [
  { value: "chronological", label: "ქრონოლოგიური" },
  { value: "by-test", label: "ტესტების მიხედვით" },
  { value: "by-group", label: "ჯგუფების მიხედვით" },
  { value: "by-student", label: "მოსწავლეების მიხედვით" },
  { value: "by-result", label: "შედეგების მიხედვით" },
];

const SHOW_BTN =
  "rounded-full border-2 border-marker text-marker font-body font-medium py-2 " +
  "transition-colors hover:bg-paper disabled:opacity-50 disabled:cursor-not-allowed";

function ymd(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const fmt = (n: number) => String(Number(n.toFixed(1)));

function buildBlocks(rows: Row[]): TestBlock[] {
  const blocks = new Map<string, TestBlock>();
  for (const r of rows) {
    let b = blocks.get(r.eventKey);
    if (!b) {
      b = { key: r.eventKey, sentAt: r.sentAt, title: r.testTitle, groups: [] };
      blocks.set(r.eventKey, b);
    }
    const gKey = r.groupId ?? "none";
    let g = b.groups.find((x) => x.id === gKey);
    if (!g) {
      g = { id: gKey, name: r.groupName, order: r.groupOrder, students: [] };
      b.groups.push(g);
    }
    g.students.push({
      id: r.studentId,
      name: r.studentName,
      order: r.studentOrder,
      score: r.score,
      total: r.total,
    });
  }
  const list = Array.from(blocks.values());
  list.forEach((b) => {
    b.groups.sort((a, c) => a.order - c.order || a.name.localeCompare(c.name));
    b.groups.forEach((g) =>
      g.students.sort((a, c) => a.order - c.order || a.name.localeCompare(c.name))
    );
  });
  return list;
}

function TestFrame({ block }: { block: TestBlock }) {
  return (
    <div className="border border-paper-line rounded-md bg-white p-2 flex flex-col gap-1.5 shadow-sm">
      <div className="flex items-center gap-2 border border-ink-soft/40 rounded-sm bg-paper px-2 py-1.5 text-xs font-medium text-ink">
        <span className="shrink-0 text-ink-soft">{ymd(block.sentAt)}</span>
        <span className="text-paper-line">|</span>
        <HScrollText className="flex-1 min-w-0">{block.title}</HScrollText>
      </div>

      {block.groups.map((g) => {
        const total = g.students[0]?.total ?? 0;
        const avg = g.students.reduce((sum, s) => sum + s.score, 0) / g.students.length;
        return (
          <div key={g.id} className="flex flex-col gap-1">
            <div className="ml-3 flex items-center gap-2 border border-paper-line rounded-sm px-2 py-1 text-xs text-ink">
              <HScrollText className="flex-1 min-w-0">{g.name}</HScrollText>
              <span className="text-paper-line">|</span>
              <span className="shrink-0 font-medium">
                {fmt(avg)}/{total}
              </span>
            </div>

            {g.students.map((s) => (
              <div
                key={s.id}
                className="ml-6 flex items-center gap-2 px-2 py-0.5 text-xs text-ink-soft"
              >
                <HScrollText className="flex-1 min-w-0">{s.name}</HScrollText>
                <span className="text-paper-line">|</span>
                <span className="shrink-0">
                  {s.score}/{s.total}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ჩარჩო: ზევით ფიქსირებული „მონიშნეთ ტესტი", ქვემოთ 3 ხაზი შიდა სქროლით,
// მარჯვნივ კი ბლოკი, რომელიც აჩვენებს სქროლის პოზიციას.
function TestPicker({
  tests,
  value,
  onChange,
}: {
  tests: { id: string; title: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState({ top: 0, height: 100 });

  function update() {
    const el = ref.current;
    if (!el) return;
    const { scrollTop, clientHeight, scrollHeight } = el;
    if (scrollHeight <= clientHeight + 1) {
      setBar({ top: 0, height: 100 });
    } else {
      setBar({
        top: (scrollTop / scrollHeight) * 100,
        height: (clientHeight / scrollHeight) * 100,
      });
    }
  }

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [tests]);

  return (
    <div className="border border-paper-line rounded-md bg-white overflow-hidden">
      <div className="px-3 py-2 text-sm font-medium text-ink bg-paper border-b border-paper-line">
        მონიშნეთ ტესტი
      </div>
      <div className="flex">
        <div
          ref={ref}
          onScroll={update}
          className="h-[7.5rem] flex-1 min-w-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tests.length === 0 ? (
            <p className="px-3 py-3 text-sm text-ink-soft">
              ჩატარებული ტესტები ჯერ არ არის
            </p>
          ) : (
            tests.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange(t.id)}
                className={`w-full h-10 px-3 flex items-center text-left text-sm
                            border-b border-paper-line last:border-b-0 ${
                              t.id === value
                                ? "bg-paper text-marker font-medium"
                                : "text-ink hover:bg-paper"
                            }`}
              >
                <HScrollText className="w-full">{t.title}</HScrollText>
              </button>
            ))
          )}
        </div>
        <div className="relative w-2.5 shrink-0 border-l border-paper-line bg-paper">
          <div
            className="absolute left-0.5 right-0.5 rounded-full bg-marker/60"
            style={{ top: `${bar.top}%`, height: `${bar.height}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function SentTestsArchive({ endpoint }: { endpoint: string }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [shown, setShown] = useState(false);
  const [selectedTest, setSelectedTest] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(PAGE);

  async function loadRows(): Promise<boolean> {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data.rows ?? []);
      setLoading(false);
      return true;
    } catch {
      setError("სიის ჩატვირთვა ვერ მოხერხდა.");
      setLoading(false);
      return false;
    }
  }

  async function show() {
    if (await loadRows()) {
      setShown(true);
      setVisible(PAGE);
    }
  }

  function changeView(v: string) {
    setView(v);
    setShown(false);
    setSelectedTest("");
    setError("");
    setVisible(PAGE);
    if (v === "by-test") loadRows();
  }

  const tests = useMemo(() => {
    const seen = new Map<string, string>();
    (rows ?? []).forEach((r) => {
      if (!seen.has(r.testId)) seen.set(r.testId, r.testTitle);
    });
    return Array.from(seen, ([id, title]) => ({ id, title }));
  }, [rows]);

  const blocks = useMemo(() => {
    if (!rows || !shown) return [];
    return buildBlocks(
      view === "by-test" ? rows.filter((r) => r.testId === selectedTest) : rows
    );
  }, [rows, shown, view, selectedTest]);

  const results = shown && (
    <>
      {blocks.length === 0 && !error && (
        <p className="text-sm text-ink-soft text-center">
          ჩატარებული ტესტები ჯერ არ არის
        </p>
      )}

      {blocks.slice(0, visible).map((b) => (
        <TestFrame key={b.key} block={b} />
      ))}

      {blocks.length > visible && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE)}
          className="text-sm text-marker font-medium hover:text-marker-dark py-1"
        >
          - ნახეთ მეტი (+{Math.min(PAGE, blocks.length - visible)}) -
        </button>
      )}
    </>
  );

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="-mx-4 rounded-full border-2 border-marker text-marker font-body
                   font-medium py-2.5 transition-colors hover:bg-paper"
      >
        ჩატარებული ტესტების არქივი
      </button>

      {open && (
        <div className="-mx-4 flex flex-col gap-3">
          <DropdownSelect
            value={view}
            onChange={changeView}
            options={VIEWS}
            placeholder="აირჩიე გამოჩენის პრინციპი"
            flipArrow
          />

          {view === "chronological" && (
            <>
              <p className="text-sm text-ink-soft text-center px-2">
                ქრონოლოგიურად გამოჩნდება აქამდე ჩატარებული ყველა ტესტი, ჯგუფი &
                მოსწავლე რომელსაც იგი ჩაუტარდა და შედეგები.
              </p>
              <button type="button" onClick={show} disabled={loading} className={SHOW_BTN}>
                {loading ? "იტვირთება..." : "გამოაჩინე"}
              </button>
              {error && <p className="text-sm text-marker-dark text-center">{error}</p>}
              {results}
            </>
          )}

          {view === "by-test" && (
            <>
              <TestPicker
                tests={tests}
                value={selectedTest}
                onChange={(id) => {
                  setSelectedTest(id);
                  setShown(false);
                  setVisible(PAGE);
                }}
              />
              <p className="text-sm text-ink-soft text-center px-2">
                მონიშნეთ რომელი ტესტის ჩატარების ისტორია გაინტერესებთ და დააჭირეთ
                ღილაკს „გამოაჩინე“
              </p>
              <button
                type="button"
                onClick={show}
                disabled={loading || !selectedTest}
                className={SHOW_BTN}
              >
                {loading ? "იტვირთება..." : "გამოაჩინე"}
              </button>
              {error && <p className="text-sm text-marker-dark text-center">{error}</p>}
              {results}
            </>
          )}
        </div>
      )}
    </div>
  );
}