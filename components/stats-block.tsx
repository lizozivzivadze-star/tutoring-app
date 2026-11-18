"use client";

import { useEffect, useState } from "react";
import Greeting from "@/components/greeting";

// ღია ყვითელი ბლოკი სტატისტიკისთვის (ფონი — იგივე, რაც dropdown-ში
// მოსწავლის სახელს აქვს; ჩარჩო — მუქი ყვითელი)
export function StatsBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full rounded-md border border-[#f7de8f] bg-[#fffbe9] px-3 py-[10px] text-left text-sm text-ink">
      {children}
    </div>
  );
}

type StaffStats = {
  role: "staff";
  name: string | null;
  teachers: number;
  sentTests: number;
  myStudents: number;
  mySent: number;
};
type StudentStats = {
  role: "student";
  name: string | null;
  students: number;
  attempts: number;
  myAttempts: number;
};

const n = (v: number | undefined) => (v === undefined ? "…" : v);

// მისალმება + სტატისტიკის ბლოკი („დაიწყე ტესტი" ტაბი და მოსწავლის გვერდი)
export function MyStats() {
  const [data, setData] = useState<StaffStats | StudentStats | null>(null);

  useEffect(() => {
    fetch("/api/my-stats", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="flex -mt-1.5">
        <Greeting name={data.name} />
      </p>
      <StatsBlock>
        {data.role === "student" ? (
          <>
            Tvinion-ით {n(data.students)} აბიტურიენტმა გააკეთა {n(data.attempts)}{" "}
            ტესტი. თქვენ გაკეთებული გაქვთ {n(data.myAttempts)} ტესტი.
          </>
        ) : (
          <>
            Tvinion-ით {n(data.teachers)} მასწავლებელმა ჩაატარა {n(data.sentTests)}{" "}
            ტესტი. თქვენ {n(data.myStudents)} მოსწავლისთვის ჩატარებული გაქვთ{" "}
            {n(data.mySent)} ტესტი.
          </>
        )}
      </StatsBlock>
    </div>
  );
}

// „ტესტები" ტაბის ბლოკი: საგანი / ტესტი / შეკითხვა
export function TestsStats({ tests, questions }: { tests: number; questions: number }) {
  return (
    <StatsBlock>
      <p>
        <span className="text-ink-soft">საგანი: </span>ისტორია
      </p>
      <p>
        <span className="text-ink-soft">ტესტი: </span>
        {tests}
      </p>
      <p>
        <span className="text-ink-soft">შეკითხვა: </span>
        {questions}
      </p>
    </StatsBlock>
  );
}
