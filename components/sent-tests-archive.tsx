"use client";

import { useState } from "react";
import DropdownSelect from "@/components/dropdown-select";
import HScrollText from "@/components/h-scroll-text";

type Row = {
  eventKey: string;
  sentAt: string;
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

export default function SentTestsArchive({ endpoint }: { endpoint: string }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("");
  const [blocks, setBlocks] = useState<TestBlock[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(PAGE);

  async function show() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBlocks(buildBlocks(data.rows ?? []));
      setVisible(PAGE);
    } catch {
      setError("სიის ჩატვირთვა ვერ მოხერხდა.");
    }
    setLoading(false);
  }

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
            onChange={(v) => {
              setView(v);
              setBlocks(null);
              setError("");
            }}
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

              <button
                type="button"
                onClick={show}
                disabled={loading}
                className="rounded-full border-2 border-marker text-marker font-body
                           font-medium py-2 transition-colors hover:bg-paper
                           disabled:opacity-50"
              >
                {loading ? "იტვირთება..." : "გამოაჩინე"}
              </button>

              {error && (
                <p className="text-sm text-marker-dark text-center">{error}</p>
              )}

              {blocks && blocks.length === 0 && !error && (
                <p className="text-sm text-ink-soft text-center">
                  ჩატარებული ტესტები ჯერ არ არის
                </p>
              )}

              {blocks?.slice(0, visible).map((b) => (
                <TestFrame key={b.key} block={b} />
              ))}

              {blocks && blocks.length > visible && (
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + PAGE)}
                  className="text-sm text-marker font-medium hover:text-marker-dark py-1"
                >
                  - ნახეთ მეტი (+{Math.min(PAGE, blocks.length - visible)}) -
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}