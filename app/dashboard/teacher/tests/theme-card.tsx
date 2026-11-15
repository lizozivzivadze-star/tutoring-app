"use client";

import Link from "next/link";
import { ThemeRecord, TYPES, TYPE_LABELS } from "./types";
import HScrollText from "@/components/h-scroll-text";

// ტესტერის theme-card-ის ასლი, მხოლოდ სანახავად: არც თემის
// რედაქტირება/წაშლა, არც ტესტის დამატება. ჩანს მხოლოდ გამოქვეყნებული
// ტესტები; ნომრები ([1.1.2]) ტესტერისას ემთხვევა.
export default function ThemeCard({
  theme,
  themeIndex,
  expanded,
  onToggleExpand,
}: {
  theme: ThemeRecord;
  themeIndex: number;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  return (
    <div
      className={`border rounded-md bg-white px-4 py-3 ${
        expanded ? "border-marker" : "border-paper-line"
      }`}
    >
      <div className="flex items-center gap-2">
        <button onClick={onToggleExpand} className="flex-1 min-w-0 text-left">
          <HScrollText className="font-body text-sm font-medium text-ink">
            {themeIndex + 1}. {theme.name}
          </HScrollText>
        </button>
      </div>

      {expanded && (
        <div className="mt-2 pl-6 flex flex-col gap-1.5">
          {TYPES.map((type, typeIndex) => {
            // ნომერი ყველა ტესტში ითვლება (ტესტერის ნომრებს რომ დაემთხვეს),
            // ჩანს კი მხოლოდ გამოქვეყნებული
            const tests = theme.tests
              .filter((t) => t.type === type)
              .sort((a, b) => a.order - b.order)
              .map((test, testIndex) => ({ test, testIndex }))
              .filter(({ test }) => test.published);

            return (
              <div key={type} className="text-sm">
                <div className="flex items-center bg-paper/50 -ml-0.5 pl-0.5 mr-6 min-h-7">
                  <span className="text-ink-soft">{TYPE_LABELS[type]}:</span>
                </div>
                {tests.length > 0 && (
                  <div className="flex flex-col items-start gap-1 mt-1 pl-3">
                    {tests.map(({ test, testIndex }) => (
                      <Link
                        key={test.id}
                        href={`/dashboard/teacher/tests/${test.id}`}
                        className={`block w-full min-w-0 ${
                          test.activated
                            ? "text-ink hover:text-marker"
                            : "text-ink-soft/50 hover:text-ink-soft"
                        }`}
                        title={
                          test.activated
                            ? ""
                            : "გამოქვეყნებულია, მაგრამ ჯერ არ არის გააქტიურებული"
                        }
                      >
                        <HScrollText>
                          {test.activated ? (
                            <span
                              aria-hidden="true"
                              className="inline-block w-2.5 h-2.5 rounded-full align-middle mr-1.5 bg-ledger"
                            />
                          ) : (
                            <svg
                              width="12"
                              height="14"
                              viewBox="0 0 12 14"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.4"
                              aria-hidden="true"
                              className="inline-block align-[-1px] mr-1"
                            >
                              <rect x="1" y="6" width="10" height="7" rx="1.5" />
                              <path d="M3.5 6V4a2.5 2.5 0 0 1 5 0v2" />
                            </svg>
                          )}
                          {test.title} [{themeIndex + 1}.{typeIndex + 1}.{testIndex + 1}]
                        </HScrollText>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
