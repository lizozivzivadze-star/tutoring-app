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
type EventBlock = { key: string; sentAt: string; title: string; students: StudentLine[] };

const PAGE = 10;

const VIEWS = [
  { value: "chronological", label: "ქრონოლოგიური" },
  { value: "by-test", label: "ტესტების მიხედვით" },
  { value: "by-group", label: "ჯგუფების მიხედვით" },
  { value: "by-student", label: "მოსწავლეების მიხედვით" },
  { value: "by-result", label: "შედეგების მიხედვით" },
];

// 100% -> 1% (სქროლის ცხრილისთვის)
const PERCENTS = Array.from({ length: 100 }, (_, i) => ({
  id: String(100 - i),
  title: `${100 - i}%`,
}));

const SHOW_BTN =
  "rounded-full border-2 border-marker text-marker font-body font-medium py-2 " +
  "transition-colors hover:bg-paper disabled:opacity-50 disabled:cursor-not-allowed";

function ymd(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const fmt = (n: number) => String(Number(n.toFixed(1)));

const byOrderThenName = (
  a: { order: number; name: string },
  c: { order: number; name: string }
) => a.order - c.order || a.name.localeCompare(c.name);

function toStudent(r: Row): StudentLine {
  return {
    id: r.studentId,
    name: r.studentName,
    order: r.studentOrder,
    score: r.score,
    total: r.total,
  };
}

// ტესტი -> ჯგუფები -> მოსწავლეები (ქრონოლოგიური და „ტესტების მიხედვით")
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
    g.students.push(toStudent(r));
  }
  const list = Array.from(blocks.values());
  list.forEach((b) => {
    b.groups.sort(byOrderThenName);
    b.groups.forEach((g) => g.students.sort(byOrderThenName));
  });
  return list;
}

// ტესტი -> მოსწავლეები (ერთი ჯგუფისთვის, „ჯგუფების მიხედვით")
function buildEventBlocks(rows: Row[]): EventBlock[] {
  const blocks = new Map<string, EventBlock>();
  for (const r of rows) {
    let b = blocks.get(r.eventKey);
    if (!b) {
      b = { key: r.eventKey, sentAt: r.sentAt, title: r.testTitle, students: [] };
      blocks.set(r.eventKey, b);
    }
    b.students.push(toStudent(r));
  }
  const list = Array.from(blocks.values());
  list.forEach((b) => b.students.sort(byOrderThenName));
  return list;
}

function StudentRows({ students }: { students: StudentLine[] }) {
  return (
    <>
      {students.map((s) => (
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
    </>
  );
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
            <StudentRows students={g.students} />
          </div>
        );
      })}
    </div>
  );
}

// „ჯგუფების მიხედვით": თარიღი | ტესტი | საშუალო, ქვემოთ მოსწავლეები
function EventFrame({ block }: { block: EventBlock }) {
  const total = block.students[0]?.total ?? 0;
  const avg = block.students.reduce((sum, s) => sum + s.score, 0) / block.students.length;
  return (
    <div className="border border-paper-line rounded-md bg-white p-2 flex flex-col gap-1.5 shadow-sm">
      <div className="flex items-center gap-2 border border-ink-soft/40 rounded-sm bg-paper px-2 py-1.5 text-xs font-medium text-ink">
        <span className="shrink-0 text-ink-soft">{ymd(block.sentAt)}</span>
        <span className="text-paper-line">|</span>
        <HScrollText className="flex-1 min-w-0">{block.title}</HScrollText>
        <span className="text-paper-line">|</span>
        <span className="shrink-0">
          {fmt(avg)}/{total}
        </span>
      </div>
      <StudentRows students={block.students} />
    </div>
  );
}
// „მოსწავლეების მიხედვით": თითო ტესტი ცალკე ჩარჩოში, 3 ხაზად
function StudentFrame({ row }: { row: Row }) {
  return (
    <div className="border border-paper-line rounded-md bg-white px-3 py-2 flex flex-col gap-1 shadow-sm text-xs text-ink">
      <span className="text-ink-soft">{ymd(row.sentAt)}</span>
      <HScrollText className="min-w-0 font-medium">{row.testTitle}</HScrollText>
      <span>
        {row.score}/{row.total}
      </span>
    </div>
  );
}

const pctOf = (r: Row) => (r.total > 0 ? Math.round((r.score / r.total) * 100) : 0);

// „შედეგების მიხედვით": მოსწავლე / ტესტი / თარიღი / შედეგი, 4 ხაზად
function ResultFrame({ row }: { row: Row }) {
  return (
    <div className="border border-paper-line rounded-md bg-white px-3 py-2 flex flex-col gap-1 shadow-sm text-xs text-ink">
      <HScrollText className="min-w-0 font-medium">{row.studentName}</HScrollText>
      <HScrollText className="min-w-0">{row.testTitle}</HScrollText>
      <span className="text-ink-soft">{ymd(row.sentAt)}</span>
      <span>
        {row.score}/{row.total} ({pctOf(row)}%)
      </span>
    </div>
  );
}

const THUMB = 20; // სქროლის კუბიკის ზომა, px

// ჩარჩო: ზევით ფიქსირებული სათაური, ქვემოთ 3 ხაზი შიდა სქროლით,
// მარჯვნივ ზოლი კუბიკით, რომელიც აჩვენებს სქროლის პოზიციას
// და რომლის გადაადგილებითაც სიის დასქროლვა შეიძლება.
function ScrollPicker({
  title,
  items,
  value,
  onChange,
  emptyText,
}: {
  title: string;
  items: { id: string; title: string }[];
  value: string;
  onChange: (id: string) => void;
  emptyText: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startScroll: number } | null>(null);
  const [pos, setPos] = useState(0); // 0..1

  function update() {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setPos(max > 1 ? el.scrollTop / max : 0);
  }

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items]);

  function onThumbDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, startScroll: el.scrollTop };
  }

  function onThumbMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    const track = trackRef.current;
    if (!el || !track || !drag.current) return;
    const travel = track.clientHeight - THUMB;
    const max = el.scrollHeight - el.clientHeight;
    if (travel <= 0 || max <= 0) return;
    el.scrollTop =
      drag.current.startScroll + ((e.clientY - drag.current.startY) / travel) * max;
  }

  function onThumbUp() {
    drag.current = null;
  }

  return (
    <div className="border border-paper-line rounded-md bg-white overflow-hidden">
      <div className="px-3 py-2 text-sm font-medium text-center text-ink bg-paper border-b border-paper-line">
        {title}
      </div>
      <div className="flex">
        <div
          ref={ref}
          onScroll={update}
          className="h-[7.5rem] flex-1 min-w-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.length === 0 ? (
            <p className="px-3 py-3 text-sm text-center text-ink-soft">{emptyText}</p>
          ) : (
            items.map((t) => (
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
                <HScrollText className="w-full text-center">{t.title}</HScrollText>
              </button>
            ))
          )}
        </div>

        <div
          ref={trackRef}
          className="relative w-6 shrink-0 border-l border-paper-line bg-paper"
        >
          <div
            onPointerDown={onThumbDown}
            onPointerMove={onThumbMove}
            onPointerUp={onThumbUp}
            onPointerCancel={onThumbUp}
            style={{
              top: `calc((100% - ${THUMB}px) * ${pos})`,
              width: THUMB,
              height: THUMB,
            }}
            className="absolute left-0.5 rounded-sm bg-marker shadow cursor-grab
                       active:cursor-grabbing touch-none"
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
  const [selectedId, setSelectedId] = useState("");
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
    setSelectedId("");
    setError("");
    setVisible(PAGE);
    if (v === "by-test" || v === "by-group" || v === "by-student" || v === "by-result")
      loadRows();
  }

  function pick(id: string) {
    setSelectedId(id);
    setShown(false);
    setVisible(PAGE);
  }

  const tests = useMemo(() => {
    const seen = new Map<string, string>();
    (rows ?? []).forEach((r) => {
      if (!seen.has(r.testId)) seen.set(r.testId, r.testTitle);
    });
    return Array.from(seen, ([id, title]) => ({ id, title }));
  }, [rows]);

  const groups = useMemo(() => {
    const seen = new Map<string, { name: string; order: number }>();
    (rows ?? []).forEach((r) => {
      const id = r.groupId ?? "none";
      if (!seen.has(id)) seen.set(id, { name: r.groupName, order: r.groupOrder });
    });
    return Array.from(seen, ([id, g]) => ({ id, title: g.name, order: g.order }))
      .sort((a, c) => a.order - c.order || a.title.localeCompare(c.title))
      .map(({ id, title }) => ({ id, title }));
  }, [rows]);

    const students = useMemo(() => {
    const seen = new Map<string, { name: string; gOrder: number; sOrder: number }>();
    (rows ?? []).forEach((r) => {
      if (!seen.has(r.studentId)) {
        seen.set(r.studentId, {
          name: r.studentName,
          gOrder: r.groupOrder,
          sOrder: r.studentOrder,
        });
      }
    });
    return Array.from(seen, ([id, s]) => ({ id, title: s.name, ...s }))
      .sort(
        (a, c) =>
          a.gOrder - c.gOrder || a.sOrder - c.sOrder || a.title.localeCompare(c.title)
      )
      .map(({ id, title }) => ({ id, title }));
  }, [rows]);

  const list = useMemo(() => {
    if (!rows || !shown) return [];
    if (view === "by-result") {
      return rows
        .filter((r) => pctOf(r) === Number(selectedId))
        .map((r) => ({
          key: `${r.eventKey}:${r.studentId}`,
          node: <ResultFrame row={r} />,
        }));
    }
    if (view === "by-student") {
      return rows
        .filter((r) => r.studentId === selectedId)
        .map((r) => ({
          key: `${r.eventKey}:${r.studentId}`,
          node: <StudentFrame row={r} />,
        }));
    }
    if (view === "by-group") {
      return buildEventBlocks(
        rows.filter((r) => (r.groupId ?? "none") === selectedId)
      ).map((b) => ({ key: b.key, node: <EventFrame block={b} /> }));
    }
    return buildBlocks(
      view === "by-test" ? rows.filter((r) => r.testId === selectedId) : rows
    ).map((b) => ({ key: b.key, node: <TestFrame block={b} /> }));
  }, [rows, shown, view, selectedId]);

  const results = shown && (
    <>
      {list.length === 0 && !error && (
        <p className="text-sm text-ink-soft text-center">
          {view === "by-result"
            ? "ამ შედეგით ტესტი არავის აქვს ჩატარებული"
            : "ჩატარებული ტესტები ჯერ არ არის"}
        </p>
      )}

      {list.slice(0, visible).map((item) => (
        <div key={item.key}>{item.node}</div>
      ))}

      {list.length > visible && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE)}
          className="text-sm text-marker font-medium hover:text-marker-dark py-1"
        >
          - ნახეთ მეტი (+{Math.min(PAGE, list.length - visible)}) -
        </button>
      )}
    </>
  );

  return (
    <div className="w-[95vw] relative left-1/2 -ml-[47.5vw] flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
className="w-full rounded-md border-2 border-marker text-marker font-body
           font-medium py-2.5 transition-colors hover:bg-paper"
      >
        ჩატარებული ტესტების არქივი
      </button>

      {open && (
        <div className="flex flex-col gap-3">
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
              <ScrollPicker
                title="მონიშნეთ ტესტი"
                items={tests}
                value={selectedId}
                onChange={pick}
                emptyText="ჩატარებული ტესტები ჯერ არ არის"
              />
              <p className="text-sm text-ink-soft text-center px-2">
                მონიშნეთ რომელი ტესტის ჩატარების ისტორია გაინტერესებთ და დააჭირეთ
                ღილაკს 
              </p>
              <button
                type="button"
                onClick={show}
                disabled={loading || !selectedId}
                className={SHOW_BTN}
              >
                {loading ? "იტვირთება..." : "გამოაჩინე"}
              </button>
              {error && <p className="text-sm text-marker-dark text-center">{error}</p>}
              {results}
            </>
          )}

          {view === "by-group" && (
            <>
              <ScrollPicker
                title="მონიშნეთ ჯგუფი"
                items={groups}
                value={selectedId}
                onChange={pick}
                emptyText="ჩატარებული ტესტები ჯერ არ არის"
              />
              <p className="text-sm text-ink-soft text-center px-2">
                მონიშნეთ რომელი ჯგუფის ტესტირების ისტორია გაინტერესებთ და დააჭირეთ
                ღილაკს
              </p>
              <button
                type="button"
                onClick={show}
                disabled={loading || !selectedId}
                className={SHOW_BTN}
              >
                {loading ? "იტვირთება..." : "გამოაჩინე"}
              </button>
              {error && <p className="text-sm text-marker-dark text-center">{error}</p>}
              {results}
            </>
          )}
      {view === "by-student" && (
            <>
              <ScrollPicker
                title="მონიშნეთ მოსწავლე"
                items={students}
                value={selectedId}
                onChange={pick}
                emptyText="ჩატარებული ტესტები ჯერ არ არის"
              />
              <p className="text-sm text-ink-soft text-center px-2">
                მონიშნეთ რომელი მოსწავლის ტესტირების ისტორია გაინტერესებთ და
                დააჭირეთ ღილაკს
              </p>
              <button
                type="button"
                onClick={show}
                disabled={loading || !selectedId}
                className={SHOW_BTN}
              >
                {loading ? "იტვირთება..." : "გამოაჩინე"}
              </button>
              {error && <p className="text-sm text-marker-dark text-center">{error}</p>}
              {results}
            </>
          )}
                    {view === "by-result" && (
            <>
              <ScrollPicker
                title="მონიშნეთ შედეგი"
                items={PERCENTS}
                value={selectedId}
                onChange={pick}
                emptyText=""
              />
              <p className="text-sm text-ink-soft text-center px-2">
                მონიშნეთ შედეგი და გამოჩნდება რომელ მოსწავლეებს რომელ ტესტში აქვთ ეს
                შეფასება მიღებული
              </p>
              <button
                type="button"
                onClick={show}
                disabled={loading || !selectedId}
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