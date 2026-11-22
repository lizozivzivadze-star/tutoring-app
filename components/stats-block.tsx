"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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


// ბოლოს ნანახი რიცხვები ინახება ბრაუზერში, რომ შემდეგ გახსნაზე ბლოკი
// მაშინვე გამოჩნდეს; ახალი რიცხვები ფონზე მოდის სერვერიდან.
const CACHE_KEY = "myStats:";

// მისალმება + სტატისტიკის ბლოკი („დაიწყე ტესტი" ტაბი და მოსწავლის გვერდი).
// ბლოკი ყოველთვის ეგრევე ჩანს (ჯერ უცნობი რიცხვის ნაცვლად „…"), რომ გვერდი არ ახტეს.
export function MyStats() {
  const isStudent = usePathname().startsWith("/dashboard/student");
  const key = CACHE_KEY + (isStudent ? "student" : "staff");
  const [data, setData] = useState<StaffStats | StudentStats | null>(null);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(key);
      if (cached) setData(JSON.parse(cached));
    } catch {}
    fetch("/api/my-stats", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setData(d);
        try {
          localStorage.setItem(key, JSON.stringify(d));
        } catch {}
      })
      .catch(() => {});
  }, [key]);

  return (
    <div className="flex flex-col gap-2">
      <p className="flex -mt-1.5">
        <Greeting name={data?.name} />
      </p>
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
