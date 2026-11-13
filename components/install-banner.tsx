"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useInstall } from "@/components/install-provider";
import { useInstallGuide } from "@/components/install-guide";
import { isStandalone } from "@/lib/install-env";

// "აპლიკაციად დაყენების" ბარათი გვერდის თავში. ჩანს მანამ, სანამ ეს
// ექაუნთი აპს ერთხელ მაინც არ გახსნის; მერე ქრება (სერვერზე ვინახავთ).
// ყველა გვერდზე (layout.tsx-იდან); login-ზე და ტესტის შესრულებისას
// დამალულია. ლოგინის გვერდზე ინსტალაციას install-card.tsx აჩვენებს.
export default function InstallBanner() {
  const pathname = usePathname();
  const { installed } = useInstall();
  const { openInstall, guideModal } = useInstallGuide();

  const [standalone, setStandalone] = useState(false);
  const [standaloneChecked, setStandaloneChecked] = useState(false);
  const [serverInstalled, setServerInstalled] = useState(false);
  const [serverChecked, setServerChecked] = useState(false);
  const serverDone = useRef(false);

  const isLoginPage = pathname === "/" || pathname.startsWith("/login");
  const isTakingTest = pathname.startsWith("/dashboard/student/take");

  useEffect(() => {
    setStandalone(isStandalone());
    setStandaloneChecked(true);
  }, []);

  // სერვერთან სინქრონი (შესვლის შემდეგ), ექაუნთის მიხედვით:
  // აპის რეჟიმში გახსნისას ვინახავთ, რომ ეს მომხმარებელი აპს იყენებს.
  // ლოგინის გვერდზე სესია არ არის: იქ ყველაფერს ვასუფთავებთ, რომ
  // სხვა ექაუნთით შესვლისას წინა ექაუნთის შედეგი არ დარჩეს.
  useEffect(() => {
    if (isLoginPage) {
      serverDone.current = false;
      setServerInstalled(false);
      setServerChecked(true);
      return;
    }
    if (serverDone.current) return;
    setServerChecked(false);
    fetch("/api/app-installed", { method: isStandalone() ? "POST" : "GET" })
      .then((r) => {
        if (r.status === 401) {
          setServerChecked(true); // ჯერ არ შესულა: შემდეგ გვერდზე ვცდით
          return null;
        }
        serverDone.current = true;
        return r.json();
      })
      .then((d) => {
        if (d?.installed) setServerInstalled(true);
        setServerChecked(true);
      })
      .catch(() => setServerChecked(true));
  }, [pathname, isLoginPage]);

  if (isLoginPage || isTakingTest) return null;

  if (!standaloneChecked || !serverChecked) return null;
  if (installed || standalone || serverInstalled) return null;

  return (
    <>
      <div
        className="m-2.5 flex items-center gap-3 rounded-2xl border border-[#f8e7a8] bg-[#fffbe9] px-3 py-2.5 shadow-sm"
      >
        <Image
          src="/icons/mascot-nobg.png"
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 object-contain"
        />

        <div className="flex h-11 min-w-0 flex-1 flex-col justify-center text-sm leading-5 text-marker">
          <span className="font-bold">Tvinion</span>
          <span className="truncate">დააყენე აპლიკაციად</span>
        </div>

        <button
          type="button"
          aria-label="დააყენე აპლიკაციად"
          onClick={openInstall}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-ink shadow-[0_2px_0_#f2c230] transition-colors hover:bg-gold-hover"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3v12" />
            <path d="M7 11l5 5 5-5" />
            <path d="M5 20h14" />
          </svg>
        </button>
      </div>

      {guideModal}
    </>
  );
}