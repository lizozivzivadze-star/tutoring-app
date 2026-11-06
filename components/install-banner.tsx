"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useInstallGuide } from "@/components/install-guide";
import { isStandalone } from "@/lib/install-env";

// "აპლიკაციად დაყენების" ბარათი გვერდის თავში.
// ჩანს ყველა მოწყობილობაზე და ყველა ბრაუზერში. იმალება მხოლოდ მაშინ,
// როცა საიტი უკვე აპის რეჟიმშია გახსნილი (ხატულიდან).
//   variant="app"   — ყველა გვერდზე (layout.tsx-იდან); login-ზე და ტესტის
//                     შესრულებისას დამალულია
//   variant="login" — ლოგინის გვერდის შიგნით (page.tsx-იდან), ყოველთვის ჩანს
export default function InstallBanner({
  variant = "app",
}: {
  variant?: "app" | "login";
}) {
  const pathname = usePathname();
  const { openInstall, guideModal } = useInstallGuide();
  const [checked, setChecked] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setStandalone(isStandalone());
    setChecked(true);
  }, []);

  const isLoginPage = pathname === "/" || pathname.startsWith("/login");
  const isTakingTest = pathname.startsWith("/dashboard/student/take");

  if (variant === "app" && (isLoginPage || isTakingTest)) return null;

  if (!checked || standalone) return null;

  return (
    <>
      <div
        className={`flex items-center gap-3 rounded-2xl border border-[#f8e7a8] bg-[#fffbe9] px-3 py-2.5 shadow-sm ${
          variant === "login" ? "mt-3 w-full shrink-0" : "m-2.5"
        }`}
      >
        <Image
          src="/icons/mascot-nobg.png"
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 object-contain"
        />

        <div className="flex h-11 min-w-0 flex-1 flex-col justify-between text-sm leading-5 text-marker">
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